"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function adminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.is_admin !== true) redirect("/admin/login?error=Please%20sign%20in%20as%20an%20administrator");
  return supabase;
}
function value(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
export async function createCategory(formData: FormData) {
  const supabase = await adminClient();
  const name = value(formData,"name"), slug = value(formData,"slug"), description = value(formData,"description");
  const parent = value(formData,"parent_id");
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    redirect("/admin/dashboard?error=Enter%20a%20name%20and%20a%20valid%20slug");
  }

  // Validate the selected parent before insert so users get a useful message.
  // The database trigger remains the final authority for concurrent changes,
  // cycle prevention, and the three-level hierarchy limit.
  if (parent) {
    const { data: rows, error: parentReadError } = await supabase.from("categories").select("id,parent_id");
    if (parentReadError) {
      redirect("/admin/dashboard?error=Could%20not%20verify%20the%20parent%20category.%20Refresh%20and%20try%20again");
    }
    const byId = new Map((rows ?? []).map((row) => [row.id, row]));
    let current = byId.get(parent);
    if (!current) {
      redirect("/admin/dashboard?error=The%20selected%20parent%20category%20was%20not%20found.%20Refresh%20the%20page");
    }
    let depth = 1;
    const visited = new Set<string>();
    while (current.parent_id) {
      if (visited.has(current.id)) {
        redirect("/admin/dashboard?error=The%20existing%20category%20hierarchy%20contains%20a%20cycle.%20Contact%20support");
      }
      visited.add(current.id);
      const ancestor = byId.get(current.parent_id);
      if (!ancestor) break;
      depth += 1;
      current = ancestor;
    }
    if (depth >= 3) {
      redirect("/admin/dashboard?error=Categories%20can%20have%20at%20most%20three%20levels.%20Choose%20a%20level%201%20or%202%20parent");
    }
  }

  const { error } = await supabase.from("categories").insert({ name, slug, description: description || null, parent_id: parent || null });
  if (error) {
    let message = "Category could not be saved. Please try again.";
    if (error.code === "23505") message = "This slug already exists under the selected parent category.";
    else if (error.code === "23514") message = "The category hierarchy is limited to three levels, and cannot contain a cycle.";
    else if (error.code === "23503") message = "The selected parent category no longer exists. Refresh and try again.";
    else if (error.code === "42501") message = "Your current session does not have permission to manage categories. Sign out and sign in again.";
    redirect(`/admin/dashboard?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/"); revalidatePath("/furniture"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Category%20created");
}
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
function imageFiles(formData: FormData) {
  const item = formData.get("image");
  return item instanceof File && item.size > 0 ? [item] : [];
}
function validImages(files: File[]) {
  return files.length <= 1 && files.every((file) => Boolean(IMAGE_TYPES[file.type]) && file.size <= MAX_IMAGE_BYTES);
}
async function storeImage(supabase: Awaited<ReturnType<typeof createClient>>, file: File, path: string) {
  if (!IMAGE_TYPES[file.type] || file.size < 1 || file.size > MAX_IMAGE_BYTES) throw new Error("Use JPG, PNG, WebP or GIF images up to 8 MB each.");
  const storagePath = `${path}/${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`;
  const { error } = await supabase.storage.from("furniture-images").upload(storagePath, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Storage upload failed. Check the furniture-images bucket and admin storage policy.");
  return storagePath;
}
async function saveProductImages(supabase: Awaited<ReturnType<typeof createClient>>, productId: string, files: File[], altText: string) {
  const { data: existingPrimary } = await supabase.from("product_images").select("id").eq("product_id", productId).eq("is_primary", true).maybeSingle();
  for (let i = 0; i < files.length; i++) {
      const storagePath = await storeImage(supabase, files[i], `products/${productId}`);
      const { data, error } = await supabase.from("product_images").insert({
        product_id: productId, storage_path: storagePath,
        alt_text: altText || null, is_primary: false,
      }).select("id").single();
      if (error || !data) throw new Error("Image uploaded but its product record could not be saved.");
      if (i === 0 && !existingPrimary) {
        const { error: primaryError } = await supabase.rpc("set_primary_product_image", { target_product_id: productId, target_image_id: data.id });
        if (primaryError) throw new Error("Image saved, but could not set the first image as primary.");
      }
  }
}
export async function createProduct(formData: FormData) {
  const supabase = await adminClient();
  const name = value(formData,"name"), model = value(formData,"model"), category_id = value(formData,"category_id"), description = value(formData,"description");
  const files = imageFiles(formData);
  if (!name || !model || !category_id) redirect("/admin/dashboard?error=Product%20name%2C%20model%20and%20category%20are%20required");
  if (!validImages(files)) redirect("/admin/dashboard?error=Upload%20one%20JPG%2C%20PNG%2C%20WebP%20or%20GIF%20image%20up%20to%203MB");
  const { data: product, error } = await supabase.from("products").insert({ name, model, category_id, description: description || null }).select("id").single();
  if (error || !product) {
    const message = error?.code === "23505" ? "That model number already exists. Model numbers must be unique." : "Product could not be saved. Check the model number and category.";
    redirect(`/admin/dashboard?error=${encodeURIComponent(message)}`);
  }
  if (files.length) {
    try { await saveProductImages(supabase, product.id, files, value(formData,"alt_text").slice(0,1000)); }
    catch (error) {
      revalidatePath("/"); revalidatePath("/furniture"); revalidatePath("/admin/dashboard");
      redirect(`/admin/dashboard?error=${encodeURIComponent(`Product created, but image upload failed: ${error instanceof Error ? error.message : "please retry"}`)}`);
    }
  }
  revalidatePath("/"); revalidatePath("/furniture"); revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?saved=Product%20and%20images%20saved");
}
export async function updateProduct(formData: FormData) {
  const supabase = await adminClient();
  const id = value(formData,"id"), name = value(formData,"name"), model = value(formData,"model"), category_id = value(formData,"category_id"), description = value(formData,"description"), status = value(formData,"status");
  if (!id || !name || !model || !category_id || !["active","inactive"].includes(status)) redirect("/admin/dashboard?error=Check%20the%20product%20details");
  const { error } = await supabase.from("products").update({name,model,category_id,description:description||null,status}).eq("id",id);
  if (error) {
    const message = error.code === "23505" ? "That model number is already in use." : "Product details could not be updated.";
    redirect(`/admin/dashboard?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/"); revalidatePath("/furniture"); revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?saved=Product%20updated");
}
export async function deleteProduct(formData: FormData) {
  const supabase = await adminClient();
  const id = value(formData,"id");
  if (!id) redirect("/admin/dashboard?error=Invalid%20product");
  const {data: images,error: readError}=await supabase.from("product_images").select("id,storage_path").eq("product_id",id);
  if(readError) redirect("/admin/dashboard?error=Could%20not%20load%20product%20images%20before%20deletion");
  if(images?.length){
    const {error:storageError}=await supabase.storage.from("furniture-images").remove(images.map((item)=>item.storage_path));
    if(storageError) redirect("/admin/dashboard?error=Could%20not%20delete%20product%20images.%20Product%20was%20not%20deleted");
  }
  const {error}=await supabase.from("products").delete().eq("id",id);
  if(error) redirect("/admin/dashboard?error=Product%20could%20not%20be%20deleted");
  revalidatePath("/"); revalidatePath("/furniture"); revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?saved=Product%20and%20its%20images%20deleted");
}
export async function createProject(formData: FormData) {
  const supabase = await adminClient();
  const name = value(formData,"name"), slug = value(formData,"slug"), description = value(formData,"description");
  const files = imageFiles(formData);
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) redirect("/admin/dashboard?error=Enter%20a%20project%20name%20and%20a%20valid%20slug");
  if (!validImages(files)) redirect("/admin/dashboard?error=Upload%20up%20to%208%20JPG%2C%20PNG%2C%20WebP%20or%20GIF%20images%2C%20maximum%208MB%20each");
  const { data: project, error } = await supabase.from("projects").insert({ name, slug, description: description || null }).select("id").single();
  if (error || !project) redirect(`/admin/dashboard?error=${encodeURIComponent(error?.code === "23505" ? "That project slug already exists." : "Project could not be saved.")}`);
  if(files.length){
    try { await saveProjectImages(supabase,project.id,files,value(formData,"alt_text").slice(0,1000)); }
    catch(error){ revalidatePath("/projects"); revalidatePath("/admin/dashboard"); redirect(`/admin/dashboard?error=${encodeURIComponent(`Project created, but image upload failed: ${error instanceof Error ? error.message : "please retry"}`)}`); }
  }
  revalidatePath("/"); revalidatePath("/projects"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Project%20and%20images%20saved");
}
async function saveProjectImages(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string, files: File[], altText: string) {
  for(let i=0;i<files.length;i++){
    const storagePath=await storeImage(supabase,files[i],`projects/${projectId}`);
    const {data,error}=await supabase.from("project_images").insert({project_id:projectId,storage_path:storagePath,alt_text:altText||null,is_primary:false}).select("id").single();
    if(error||!data){await supabase.storage.from("furniture-images").remove([storagePath]);throw new Error("Image uploaded but its project record could not be saved.");}
    if(i===0){
      const {error:primaryError}=await supabase.from("project_images").update({is_primary:false}).eq("project_id",projectId);
      if(primaryError) throw new Error("Could not update primary project image.");
      const {error:setError}=await supabase.from("project_images").update({is_primary:true}).eq("id",data.id);
      if(setError) throw new Error("Could not set the first project image as primary.");
    }
  }
}
export async function uploadMoreProjectImages(formData: FormData) {
  const supabase=await adminClient(); const projectId=value(formData,"project_id"),altText=value(formData,"alt_text").slice(0,1000),files=imageFiles(formData);
  if(!projectId||!files.length||!validImages(files)) redirect("/admin/dashboard?error=Choose%20one%20JPG%2C%20PNG%2C%20WebP%20or%20GIF%20image%20up%20to%203MB");
  const {data:project}=await supabase.from("projects").select("id").eq("id",projectId).maybeSingle();
  if(!project) redirect("/admin/dashboard?error=Project%20not%20found");
  const {data:existingPrimary}=await supabase.from("project_images").select("id").eq("project_id",projectId).eq("is_primary",true).maybeSingle();
  for(let i=0;i<files.length;i++){
    const path=await storeImage(supabase,files[i],`projects/${projectId}`);
    const {data,error}=await supabase.from("project_images").insert({project_id:projectId,storage_path:path,alt_text:altText||null,is_primary:false}).select("id").single();
    if(error||!data){await supabase.storage.from("furniture-images").remove([path]);redirect("/admin/dashboard?error=Project%20image%20metadata%20could%20not%20be%20saved");}
    if(i===0&&!existingPrimary){
      const {error:setError}=await supabase.from("project_images").update({is_primary:true}).eq("id",data.id);
      if(setError) redirect("/admin/dashboard?error=Could%20not%20set%20the%20primary%20project%20image");
    }
  }
  revalidatePath("/"); revalidatePath("/projects"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Project%20gallery%20updated");
}
export async function updateProject(formData: FormData) {
  const supabase=await adminClient();
  const id=value(formData,"id"),name=value(formData,"name"),slug=value(formData,"slug"),description=value(formData,"description"),status=value(formData,"status");
  if(!id||!name||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!["active","inactive"].includes(status)) redirect("/admin/dashboard?error=Check%20the%20project%20details");
  const {error}=await supabase.from("projects").update({name,slug,description:description||null,status}).eq("id",id);
  if(error) redirect(`/admin/dashboard?error=${encodeURIComponent(error.code==="23505"?"That project slug already exists.":"Project could not be updated.")}`);
  revalidatePath("/"); revalidatePath("/projects"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Project%20updated");
}
export async function deleteProject(formData: FormData) {
  const supabase=await adminClient(); const id=value(formData,"id");
  if(!id) redirect("/admin/dashboard?error=Invalid%20project");
  const {data:images,error:readError}=await supabase.from("project_images").select("storage_path").eq("project_id",id);
  if(readError) redirect("/admin/dashboard?error=Could%20not%20load%20project%20images");
  if(images?.length){const {error}=await supabase.storage.from("furniture-images").remove(images.map((item)=>item.storage_path));if(error)redirect("/admin/dashboard?error=Could%20not%20delete%20project%20images");}
  const {error}=await supabase.from("projects").delete().eq("id",id);
  if(error) redirect("/admin/dashboard?error=Project%20could%20not%20be%20deleted");
  revalidatePath("/"); revalidatePath("/projects"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Project%20and%20images%20deleted");
}
export async function setPrimaryProjectImage(formData: FormData) {
  const supabase=await adminClient(); const id=value(formData,"image_id"),projectId=value(formData,"project_id");
  if(!id||!projectId) redirect("/admin/dashboard?error=Invalid%20project%20image");
  const {error:clearError}=await supabase.from("project_images").update({is_primary:false}).eq("project_id",projectId);
  if(clearError) redirect("/admin/dashboard?error=Could%20not%20update%20project%20image");
  const {error}=await supabase.from("project_images").update({is_primary:true}).eq("id",id).eq("project_id",projectId);
  if(error) redirect("/admin/dashboard?error=Could%20not%20set%20primary%20project%20image");
  revalidatePath("/projects"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Primary%20project%20image%20updated");
}
export async function deleteProjectImage(formData: FormData) {
  const supabase=await adminClient(); const id=value(formData,"image_id");
  const {data:image,error:readError}=await supabase.from("project_images").select("id,storage_path,project_id,is_primary").eq("id",id).maybeSingle();
  if(readError||!image) redirect("/admin/dashboard?error=Project%20image%20not%20found");
  const {error:storageError}=await supabase.storage.from("furniture-images").remove([image.storage_path]);
  if(storageError) redirect("/admin/dashboard?error=Could%20not%20delete%20project%20image%20file");
  const {error}=await supabase.from("project_images").delete().eq("id",id);
  if(error) redirect("/admin/dashboard?error=Could%20not%20delete%20project%20image%20record");
  if(image.is_primary){
    const {data:nextImage}=await supabase.from("project_images").select("id").eq("project_id",image.project_id).order("created_at",{ascending:true}).limit(1).maybeSingle();
    if(nextImage){await supabase.from("project_images").update({is_primary:false}).eq("project_id",image.project_id);await supabase.from("project_images").update({is_primary:true}).eq("id",nextImage.id);}
  }
  revalidatePath("/projects"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Project%20image%20deleted");
}
export async function updateCategory(formData: FormData) {
  const supabase=await adminClient();
  const id=value(formData,"id"),name=value(formData,"name"),slug=value(formData,"slug"),description=value(formData,"description"),status=value(formData,"status"),parent_id=value(formData,"parent_id");
  if(!id||!name||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!["active","inactive"].includes(status)||parent_id===id) redirect("/admin/dashboard?error=Check%20the%20category%20details");
  const {error}=await supabase.from("categories").update({name,slug,description:description||null,status,parent_id:parent_id||null}).eq("id",id);
  if(error) redirect(`/admin/dashboard?error=${encodeURIComponent(error.code==="23505"?"That slug already exists under this parent.":"Category could not be updated.")}`);
  revalidatePath("/"); revalidatePath("/furniture"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Category%20updated");
}
export async function deleteCategory(formData: FormData) {
  const supabase=await adminClient(); const id=value(formData,"id");
  if(!id) redirect("/admin/dashboard?error=Invalid%20category");
  const [{data:products},{data:children},{data:image}]=await Promise.all([
    supabase.from("products").select("id").eq("category_id",id).limit(1),
    supabase.from("categories").select("id").eq("parent_id",id).limit(1),
    supabase.from("category_images").select("storage_path").eq("category_id",id).maybeSingle(),
  ]);
  if(products?.length||children?.length) redirect("/admin/dashboard?error=Move%20or%20delete%20this%20category's%20products%20and%20child%20categories%20first");
  const {error}=await supabase.from("categories").delete().eq("id",id);
  if(error) redirect("/admin/dashboard?error=Category%20could%20not%20be%20deleted");
  if(image?.storage_path) await supabase.storage.from("furniture-images").remove([image.storage_path]);
  revalidatePath("/"); revalidatePath("/furniture"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Category%20deleted");
}
export async function uploadCategoryImage(formData: FormData) {
  const supabase=await adminClient(); const categoryId=value(formData,"category_id"),altText=value(formData,"alt_text").slice(0,1000),file=formData.get("image");
  if(!categoryId||!(file instanceof File)||file.size===0||!validImages([file])) redirect("/admin/dashboard?error=Choose%20a%20JPG%2C%20PNG%2C%20WebP%20or%20GIF%20image%20up%20to%208MB");
  const {data:category}=await supabase.from("categories").select("id").eq("id",categoryId).maybeSingle();
  if(!category) redirect("/admin/dashboard?error=Category%20not%20found");
  const path=await storeImage(supabase,file,`categories/${categoryId}`);
  const {data:old}=await supabase.from("category_images").select("id,storage_path").eq("category_id",categoryId).maybeSingle();
  const {error}=await supabase.from("category_images").upsert({category_id:categoryId,storage_path:path,alt_text:altText||null},{onConflict:"category_id"});
  if(error){await supabase.storage.from("furniture-images").remove([path]);redirect("/admin/dashboard?error=Category%20image%20could%20not%20be%20saved");}
  if(old?.storage_path) await supabase.storage.from("furniture-images").remove([old.storage_path]);
  revalidatePath("/"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Category%20image%20saved");
}
export async function uploadMoreProductImages(formData: FormData) {
  const supabase=await adminClient(); const productId=value(formData,"product_id"),altText=value(formData,"alt_text").slice(0,1000),files=imageFiles(formData);
  if(!productId||!files.length||!validImages(files)) redirect("/admin/dashboard?error=Choose%20one%20JPG%2C%20PNG%2C%20WebP%20or%20GIF%20image%20up%20to%203MB");
  const {data:product}=await supabase.from("products").select("id").eq("id",productId).maybeSingle();
  if(!product) redirect("/admin/dashboard?error=Product%20not%20found");
  try{await saveProductImages(supabase,productId,files,altText);}catch(error){redirect(`/admin/dashboard?error=${encodeURIComponent(error instanceof Error?error.message:"Product image upload failed")}`);}
  revalidatePath("/"); revalidatePath("/furniture"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Product%20images%20uploaded");
}
export async function setPrimaryProductImage(formData: FormData) {
  const supabase=await adminClient(); const id=value(formData,"image_id"),productId=value(formData,"product_id");
  if(!id||!productId) redirect("/admin/dashboard?error=Invalid%20product%20image");
  const {error}=await supabase.rpc("set_primary_product_image",{target_product_id:productId,target_image_id:id});
  if(error) redirect("/admin/dashboard?error=Could%20not%20set%20the%20primary%20image");
  revalidatePath("/"); revalidatePath("/furniture"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Primary%20product%20image%20updated");
}
export async function updateContactStatus(formData: FormData) {
  const supabase = await adminClient();
  const id = value(formData,"id"), status = value(formData,"status");
  if (!id || !["new","in_progress","resolved","spam"].includes(status)) redirect("/admin/dashboard?error=Invalid%20contact%20status");
  const { error } = await supabase.from("contacts").update({ status }).eq("id",id);
  if (error) redirect("/admin/dashboard?error=Could%20not%20update%20contact");
  revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Contact%20updated");
}
export async function updateCatalogStatus(formData: FormData) {
  const supabase = await adminClient();
  const table = value(formData,"table") as "categories" | "products" | "projects", id = value(formData,"id"), status = value(formData,"status");
  if (!["categories","products","projects"].includes(table) || !id || !["active","inactive"].includes(status)) redirect("/admin/dashboard?error=Invalid%20catalog%20update");
  const { error } = await supabase.from(table).update({ status }).eq("id",id);
  if (error) redirect("/admin/dashboard?error=Could%20not%20update%20catalog%20status");
  revalidatePath("/"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Catalog%20status%20updated");
}


export async function uploadProductImage(formData: FormData) {
  const supabase = await adminClient();
  const productId = value(formData, "product_id");
  const altText = value(formData, "alt_text").slice(0, 1000);
  const makePrimary = formData.get("is_primary") === "on";
  const file = formData.get("image");
  if (!productId || !(file instanceof File) || file.size === 0) {
    redirect("/admin/dashboard?error=Choose%20a%20product%20and%20an%20image");
  }
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
  if (!allowedTypes.has(file.type) || file.size > 8 * 1024 * 1024) {
    redirect("/admin/dashboard?error=Use%20a%20JPG%2C%20PNG%2C%20WebP%20or%20AVIF%20image%20up%20to%208MB");
  }
  const { data: product, error: productError } = await supabase.from("products").select("id").eq("id", productId).maybeSingle();
  if (productError || !product) redirect("/admin/dashboard?error=Select%20a%20valid%20product");
  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as Record<string, string>)[file.type];
  const storagePath = `${productId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("furniture-images").upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) redirect("/admin/dashboard?error=Image%20upload%20failed.%20Check%20the%20Storage%20migration%20and%20bucket%20configuration");
  const { data: imageRow, error: insertError } = await supabase.from("product_images").insert({
    product_id: productId, storage_path: storagePath, alt_text: altText || null, is_primary: false,
  }).select("id").single();
  if (insertError || !imageRow) {
    await supabase.storage.from("furniture-images").remove([storagePath]);
    redirect("/admin/dashboard?error=Image%20uploaded%20but%20image%20metadata%20could%20not%20be%20saved");
  }
  if (makePrimary) {
    const { error: primaryError } = await supabase.rpc("set_primary_product_image", {
      target_product_id: productId,
      target_image_id: imageRow.id,
    });
    if (primaryError) {
      await supabase.storage.from("furniture-images").remove([storagePath]);
      await supabase.from("product_images").delete().eq("id", imageRow.id);
      redirect("/admin/dashboard?error=Image%20saved%20but%20could%20not%20set%20it%20as%20primary");
    }
  }
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?saved=Product%20image%20uploaded");
}

export async function deleteProductImage(formData: FormData) {
  const supabase=await adminClient(); const imageId=value(formData,"image_id");
  if(!imageId) redirect("/admin/dashboard?error=Invalid%20image");
  const {data:image,error:readError}=await supabase.from("product_images").select("id,storage_path,product_id,is_primary").eq("id",imageId).maybeSingle();
  if(readError||!image) redirect("/admin/dashboard?error=Image%20not%20found");
  const {error:removeError}=await supabase.storage.from("furniture-images").remove([image.storage_path]);
  if(removeError) redirect("/admin/dashboard?error=Could%20not%20remove%20the%20image%20file");
  const {error:deleteError}=await supabase.from("product_images").delete().eq("id",imageId);
  if(deleteError) redirect("/admin/dashboard?error=Image%20file%20removed%20but%20metadata%20could%20not%20be%20deleted");
  if(image.is_primary){
    const {data:nextImage}=await supabase.from("product_images").select("id").eq("product_id",image.product_id).order("created_at",{ascending:true}).limit(1).maybeSingle();
    if(nextImage) await supabase.rpc("set_primary_product_image",{target_product_id:image.product_id,target_image_id:nextImage.id});
  }
  revalidatePath("/"); revalidatePath("/furniture"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Product%20image%20deleted");
}
