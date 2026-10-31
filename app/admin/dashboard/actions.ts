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
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) redirect("/admin/dashboard?error=Enter%20a%20name%20and%20a%20valid%20slug");
  const { error } = await supabase.from("categories").insert({ name, slug, description: description || null, parent_id: parent || null });
  if (error) redirect("/admin/dashboard?error=Category%20could%20not%20be%20saved.%20Check%20the%20slug%20and%20parent%20category");
  revalidatePath("/"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Category%20created");
}
export async function createProduct(formData: FormData) {
  const supabase = await adminClient();
  const name = value(formData,"name"), model = value(formData,"model"), category_id = value(formData,"category_id"), description = value(formData,"description");
  if (!name || !model || !category_id) redirect("/admin/dashboard?error=Product%20name%2C%20model%20and%20category%20are%20required");
  const { error } = await supabase.from("products").insert({ name, model, category_id, description: description || null });
  if (error) redirect("/admin/dashboard?error=Product%20could%20not%20be%20saved.%20Check%20the%20model%20number%20and%20category");
  revalidatePath("/"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Product%20created");
}
export async function createProject(formData: FormData) {
  const supabase = await adminClient();
  const name = value(formData,"name"), slug = value(formData,"slug"), description = value(formData,"description");
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) redirect("/admin/dashboard?error=Enter%20a%20project%20name%20and%20a%20valid%20slug");
  const { error } = await supabase.from("projects").insert({ name, slug, description: description || null });
  if (error) redirect("/admin/dashboard?error=Project%20could%20not%20be%20saved.%20Check%20the%20slug");
  revalidatePath("/"); revalidatePath("/admin/dashboard"); redirect("/admin/dashboard?saved=Project%20created");
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
  const supabase = await adminClient();
  const imageId = value(formData, "image_id");
  if (!imageId) redirect("/admin/dashboard?error=Invalid%20image");
  const { data: image, error: readError } = await supabase.from("product_images").select("id,storage_path,product_id").eq("id", imageId).maybeSingle();
  if (readError || !image) redirect("/admin/dashboard?error=Image%20not%20found");
  const { error: removeError } = await supabase.storage.from("furniture-images").remove([image.storage_path]);
  if (removeError) redirect("/admin/dashboard?error=Could%20not%20remove%20the%20image%20file");
  const { error: deleteError } = await supabase.from("product_images").delete().eq("id", imageId);
  if (deleteError) redirect("/admin/dashboard?error=Image%20file%20removed%20but%20metadata%20could%20not%20be%20deleted");
  revalidatePath("/");
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?saved=Product%20image%20deleted");
}
