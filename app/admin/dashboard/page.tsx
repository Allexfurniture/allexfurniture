import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin-sidebar";
import {
  createCategory, createProduct, createProject, deleteCategory, deleteProduct, deleteProductImage,
  deleteProject, deleteProjectImage, logoutAdmin, setPrimaryProductImage, setPrimaryProjectImage,
  updateCategory, updateContactStatus, updateProduct, updateProject,
  uploadCategoryImage, uploadMoreProductImages, uploadMoreProjectImages,
} from "./actions";

export const metadata: Metadata = { title: "Admin dashboard", robots: { index: false, follow: false, noarchive: true } };
const imageAccept = "image/jpeg,image/png,image/webp,image/gif";
const imageHelp = "JPG, PNG, WebP or GIF · one image up to 3 MB per upload";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  let supabase;
  try { supabase = await createClient(); } catch { redirect("/admin/login?error=Supabase%20is%20not%20configured"); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.is_admin !== true) redirect("/admin/login");

  const [categoriesResult, productsResult, projectsResult, contactsResult] = await Promise.all([
    supabase.from("categories").select("id,name,slug,description,status,parent_id,created_at,category_images(id,storage_path,alt_text)").order("created_at", { ascending: false }).limit(200),
    supabase.from("products").select("id,name,model,description,status,category_id,created_at,categories(name),product_images(id,storage_path,alt_text,is_primary,created_at)").order("created_at", { ascending: false }).limit(200),
    supabase.from("projects").select("id,name,slug,description,status,created_at,project_images(id,storage_path,alt_text,is_primary,created_at)").order("created_at", { ascending: false }).limit(200),
    supabase.from("contacts").select("id,name,email,phone,subject,message,status,created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  const categories = categoriesResult.data ?? [];
  const products = productsResult.data ?? [];
  const projects = projectsResult.data ?? [];
  const contacts = contactsResult.data ?? [];
  const dbError = [categoriesResult.error, productsResult.error, projectsResult.error, contactsResult.error].find(Boolean);
  const categoryById = new Map(categories.map((item) => [item.id, item]));
  const categoryDepth = (id: string) => {
    let depth = 1, current = categoryById.get(id);
    const seen = new Set<string>();
    while (current?.parent_id) {
      if (seen.has(current.id)) return 99;
      seen.add(current.id);
      current = categoryById.get(current.parent_id);
      if (current) depth++;
      else break;
    }
    return depth;
  };
  const categoryLabel = (category: (typeof categories)[number]) => {
    const parts = [category.name]; let current = category; const seen = new Set([category.id]);
    while (current.parent_id) {
      const parent = categoryById.get(current.parent_id);
      if (!parent || seen.has(parent.id)) break;
      parts.unshift(parent.name); seen.add(parent.id); current = parent;
    }
    return parts.join(" / ");
  };
  const selectableParents = categories.filter((category) => categoryDepth(category.id) < 3);
  const storageBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const imageUrl = (path: string) => storageBase ? `${storageBase}/storage/v1/object/public/furniture-images/${path.split("/").map(encodeURIComponent).join("/")}` : "";
  const fmt = (date: string) => new Date(date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });

  return <main className="admin-layout">
    <AdminSidebar email={user.email} />
    <section className="admin-main">
      <div className="admin-topbar"><div><p>{new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</p><h1>Catalog workspace</h1></div><form action={logoutAdmin}><button className="admin-logout">Sign out ↗</button></form></div>
      {params.error && <div className="form-error" role="alert">{params.error}</div>}
      {params.saved && <div className="form-success" role="status">{params.saved}</div>}
      {dbError && <div className="form-error">Some data could not be loaded: {dbError.message}. Check Supabase Data API access and RLS policies.</div>}

      <div id="overview" className="stat-grid">
        <div className="stat-card"><span>Products</span><strong>{products.length}</strong><small>{products.filter((item) => item.status === "active").length} published</small></div>
        <div className="stat-card"><span>Categories</span><strong>{categories.length}</strong><small>{categories.filter((item) => item.status === "active").length} active</small></div>
        <div className="stat-card"><span>Projects</span><strong>{projects.length}</strong><small>{projects.filter((item) => item.status === "active").length} published</small></div>
        <div className="stat-card"><span>New enquiries</span><strong>{contacts.filter((item) => item.status === "new").length}</strong><small>{contacts.length} total messages</small></div>
      </div>

      <section id="products" className="admin-panel">
        <div className="panel-heading"><div><h2>Products</h2><p>Create and maintain a product, upload its photos, and select its primary image—all here.</p></div></div>
        <form action={createProduct} className="admin-form" encType="multipart/form-data">
          <div className="admin-form-title">Add a product</div>
          <div className="form-grid">
            <div className="field"><label htmlFor="product-name">Product name *</label><input id="product-name" name="name" required maxLength={300} placeholder="e.g. Rowan Sofa"/></div>
            <div className="field"><label htmlFor="product-model">Model number *</label><input id="product-model" name="model" required maxLength={100} placeholder="ALX-SF-001"/></div>
          </div>
          <div className="form-grid">
            <div className="field"><label htmlFor="product-category">Category *</label><select id="product-category" name="category_id" required defaultValue=""><option value="" disabled>Select category</option>{categories.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{categoryLabel(item)}</option>)}</select></div>
            <div className="field"><label htmlFor="product-description">Description</label><textarea id="product-description" name="description" maxLength={50000} placeholder="Materials, dimensions, finish and details"/></div>
          </div>
          <div className="form-grid">
            <div className="field"><label htmlFor="new-product-images">Product photos (optional)</label><input id="new-product-images" name="image" type="file" accept={imageAccept}/><small className="field-help">{imageHelp}. Upload one photo with the product. The first photo becomes the primary image.</small></div>
            <div className="field"><label htmlFor="new-product-alt">Image alternative text</label><input id="new-product-alt" name="alt_text" maxLength={1000} placeholder="Short description shared by uploaded photos"/></div>
          </div>
          <button className="small-button admin-primary-button" type="submit">＋ Create product and upload photos</button>
        </form>
        <div className="admin-record-list">
          {products.map((product) => {
            const productImages = [...(product.product_images ?? [])].sort((a,b) => Number(b.is_primary)-Number(a.is_primary));
            return <article className="admin-record" key={product.id}>
              <div className="admin-record-heading"><div><span className="admin-record-kicker">MODEL {product.model}</span><h3>{product.name}</h3><p>{product.categories?.name ?? "Uncategorised"} · Added {fmt(product.created_at)}</p></div><span className={`status-pill ${product.status}`}>{product.status}</span></div>
              <form action={updateProduct} className="admin-form admin-edit-form">
                <input type="hidden" name="id" value={product.id}/>
                <div className="form-grid"><div className="field"><label>Product name</label><input name="name" required maxLength={300} defaultValue={product.name}/></div><div className="field"><label>Model number</label><input name="model" required maxLength={100} defaultValue={product.model}/></div></div>
                <div className="form-grid"><div className="field"><label>Category</label><select name="category_id" required defaultValue={product.category_id}>{categories.map((item) => <option key={item.id} value={item.id}>{categoryLabel(item)}</option>)}</select></div><div className="field"><label>Status</label><select name="status" defaultValue={product.status}><option value="active">Published</option><option value="inactive">Hidden</option></select></div></div>
                <div className="field"><label>Description</label><textarea name="description" maxLength={50000} defaultValue={product.description ?? ""}/></div>
                <div className="record-actions"><button className="small-button" type="submit">Save product</button></div>
              </form>
              <div className="admin-record-subheading"><h4>Product photos <span>{productImages.length}</span></h4><p>Photos belong to this product. The primary photo is used in the storefront.</p></div>
              {productImages.length > 0 && <div className="admin-image-grid">{productImages.map((photo) => <div className={`admin-image-card ${photo.is_primary ? "is-primary" : ""}`} key={photo.id}>
                {imageUrl(photo.storage_path) ? <img src={imageUrl(photo.storage_path)} alt={photo.alt_text ?? product.name}/> : <div className="admin-image-placeholder">Photo</div>}
                <div className="admin-image-meta"><strong>{photo.is_primary ? "Primary image" : "Product image"}</strong><small>{photo.alt_text || photo.storage_path.split("/").pop()}</small></div>
                <div className="record-actions">{!photo.is_primary && <form action={setPrimaryProductImage}><input type="hidden" name="product_id" value={product.id}/><input type="hidden" name="image_id" value={photo.id}/><button className="small-button button-muted">Make primary</button></form>}<form action={deleteProductImage}><input type="hidden" name="image_id" value={photo.id}/><button className="small-button button-danger">Delete photo</button></form></div>
              </div>)}</div>}
              <form action={uploadMoreProductImages} className="admin-upload-inline">
                <input type="hidden" name="product_id" value={product.id}/>
                <label>Upload more photos<input type="file" name="image" accept={imageAccept} required/></label>
                <label>Alt text<input name="alt_text" maxLength={1000} placeholder="Describe the photos"/></label>
                <button className="small-button">Upload photos</button>
                <small>{imageHelp}; one photo per upload.</small>
              </form>
              <div className="record-footer"><form action={deleteProduct}><input type="hidden" name="id" value={product.id}/><button className="small-button button-danger">Delete product and all photos</button></form></div>
            </article>;
          })}
          {products.length === 0 && <p className="admin-empty">No products yet. Create the first product above.</p>}
        </div>
      </section>

      <section id="categories" className="admin-panel">
        <div className="panel-heading"><div><h2>Categories</h2><p>Manage hierarchy, descriptions and the collection image in the same place.</p></div></div>
        <form action={createCategory} className="admin-form">
          <div className="admin-form-title">Add a category</div>
          <div className="form-grid"><div className="field"><label htmlFor="category-name">Name *</label><input id="category-name" name="name" required maxLength={150} placeholder="Living room"/></div><div className="field"><label htmlFor="category-slug">Slug *</label><input id="category-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="living-room"/></div></div>
          <div className="form-grid"><div className="field"><label htmlFor="category-parent">Parent category</label><select id="category-parent" name="parent_id" defaultValue=""><option value="">Top-level category</option>{selectableParents.map((item) => <option key={item.id} value={item.id}>{categoryLabel(item)} · Level {categoryDepth(item.id)}</option>)}</select><small className="field-help">Maximum three levels.</small></div><div className="field"><label htmlFor="category-description">Description</label><textarea id="category-description" name="description" maxLength={10000}/></div></div>
          <button className="small-button" type="submit">＋ Create category</button>
        </form>
        <div className="admin-record-list">
          {categories.map((category) => {
            const photo = category.category_images;
            return <article className="admin-record" key={category.id}>
              <div className="admin-record-heading"><div><span className="admin-record-kicker">LEVEL {categoryDepth(category.id)}</span><h3>{categoryLabel(category)}</h3><p>/{category.slug}</p></div><span className={`status-pill ${category.status}`}>{category.status}</span></div>
              <div className="admin-category-layout">
                <div>
                  {photo && imageUrl(photo.storage_path) ? <img className="admin-category-image" src={imageUrl(photo.storage_path)} alt={photo.alt_text ?? category.name}/> : <div className="admin-category-image admin-image-placeholder">No category image</div>}
                  <form action={uploadCategoryImage} className="admin-upload-stack"><input type="hidden" name="category_id" value={category.id}/><label>{photo ? "Replace collection image" : "Upload collection image"}<input type="file" name="image" accept={imageAccept} required/></label><label>Alt text<input name="alt_text" maxLength={1000} defaultValue={photo?.alt_text ?? ""} placeholder="Describe the collection"/></label><button className="small-button">Save image</button><small>{imageHelp}. One image per category.</small></form>
                </div>
                <form action={updateCategory} className="admin-form admin-edit-form">
                  <input type="hidden" name="id" value={category.id}/>
                  <div className="field"><label>Name</label><input name="name" required maxLength={150} defaultValue={category.name}/></div>
                  <div className="field"><label>Slug</label><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={category.slug}/></div>
                  <div className="field"><label>Description</label><textarea name="description" maxLength={10000} defaultValue={category.description ?? ""}/></div>
                  <div className="field"><label>Parent category</label><select name="parent_id" defaultValue={category.parent_id ?? ""}><option value="">Top-level category</option>{selectableParents.filter((item) => item.id !== category.id).map((item) => <option key={item.id} value={item.id}>{categoryLabel(item)} · Level {categoryDepth(item.id)}</option>)}</select><small className="field-help">Database validation will prevent cycles or hierarchy depth over three levels.</small></div>
                  <div className="field"><label>Status</label><select name="status" defaultValue={category.status}><option value="active">Published</option><option value="inactive">Hidden</option></select></div>
                  <div className="record-actions"><button className="small-button">Save category</button></div>
                </form>
                <div className="record-footer"><form action={deleteCategory}><input type="hidden" name="id" value={category.id}/><button className="small-button button-danger">Delete category</button></form></div>
              </div>
            </article>;
          })}
          {categories.length === 0 && <p className="admin-empty">Create a category before adding products.</p>}
        </div>
      </section>

      <section id="projects" className="admin-panel">
        <div className="panel-heading"><div><h2>Projects & interiors</h2><p>Create a portfolio project and upload its gallery without leaving this section.</p></div></div>
        <form action={createProject} className="admin-form">
          <div className="admin-form-title">Add a project</div>
          <div className="form-grid"><div className="field"><label htmlFor="project-name">Project name *</label><input id="project-name" name="name" required maxLength={200} placeholder="Riverside Residence"/></div><div className="field"><label htmlFor="project-slug">Slug *</label><input id="project-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="riverside-residence"/></div></div>
          <div className="field"><label htmlFor="project-description">Description</label><textarea id="project-description" name="description" maxLength={50000}/></div>
          <div className="form-grid"><div className="field"><label htmlFor="new-project-images">Project gallery</label><input id="new-project-images" name="images" type="file" accept={imageAccept} multiple/><small className="field-help">{imageHelp}; one image with the project. The first image becomes the cover.</small></div><div className="field"><label htmlFor="new-project-alt">Image alt text</label><input id="new-project-alt" name="alt_text" maxLength={1000} placeholder="Describe the gallery images"/></div></div>
          <button className="small-button" type="submit">＋ Create project and gallery</button>
        </form>
        <div className="admin-record-list">
          {projects.map((project) => {
            const photos=[...(project.project_images ?? [])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary));
            return <article className="admin-record" key={project.id}>
              <div className="admin-record-heading"><div><span className="admin-record-kicker">/{project.slug}</span><h3>{project.name}</h3><p>{photos.length} gallery photos · Added {fmt(project.created_at)}</p></div><span className={`status-pill ${project.status}`}>{project.status}</span></div>
              <form action={updateProject} className="admin-form admin-edit-form">
                <input type="hidden" name="id" value={project.id}/>
                <div className="form-grid"><div className="field"><label>Name</label><input name="name" required maxLength={200} defaultValue={project.name}/></div><div className="field"><label>Slug</label><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={project.slug}/></div></div>
                <div className="field"><label>Description</label><textarea name="description" maxLength={50000} defaultValue={project.description ?? ""}/></div>
                <div className="form-grid"><div className="field"><label>Status</label><select name="status" defaultValue={project.status}><option value="active">Published</option><option value="inactive">Hidden</option></select></div><div className="record-actions"><button className="small-button">Save project</button></div></div>
              </form>
              {photos.length > 0 && <div className="admin-image-grid">{photos.map((photo) => <div className={`admin-image-card ${photo.is_primary ? "is-primary" : ""}`} key={photo.id}>
                {imageUrl(photo.storage_path) ? <img src={imageUrl(photo.storage_path)} alt={photo.alt_text ?? project.name}/> : <div className="admin-image-placeholder">Photo</div>}
                <div className="admin-image-meta"><strong>{photo.is_primary ? "Cover image" : "Gallery image"}</strong><small>{photo.alt_text || photo.storage_path.split("/").pop()}</small></div>
                <div className="record-actions">{!photo.is_primary && <form action={setPrimaryProjectImage}><input type="hidden" name="project_id" value={project.id}/><input type="hidden" name="image_id" value={photo.id}/><button className="small-button button-muted">Make cover</button></form>}<form action={deleteProjectImage}><input type="hidden" name="image_id" value={photo.id}/><button className="small-button button-danger">Delete photo</button></form></div>
              </div>)}</div>}
              <form action={uploadMoreProjectImages} className="admin-upload-inline"><input type="hidden" name="project_id" value={project.id}/><label>Upload more gallery photos<input type="file" name="images" accept={imageAccept} multiple required/></label><label>Alt text<input name="alt_text" maxLength={1000} placeholder="Describe the images"/></label><button className="small-button">Upload gallery</button><small>{imageHelp}; one image per upload.</small></form>
              <div className="record-footer"><form action={deleteProject}><input type="hidden" name="id" value={project.id}/><button className="small-button button-danger">Delete project and gallery</button></form></div>
            </article>;
          })}
          {projects.length === 0 && <p className="admin-empty">No projects yet. Create your first portfolio project above.</p>}
        </div>
      </section>

      <section id="contacts" className="admin-panel">
        <div className="panel-heading"><div><h2>Customer enquiries</h2><p>Read messages and update their workflow status.</p></div></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Received</th><th>Contact</th><th>Message</th><th>Status / update</th></tr></thead><tbody>
          {contacts.map((contact) => <tr key={contact.id}><td>{fmt(contact.created_at)}</td><td><strong>{contact.name}</strong><br/><a href={`mailto:${contact.email}`}>{contact.email}</a>{contact.phone && <><br/>{contact.phone}</>}</td><td><strong>{contact.subject}</strong><br/>{contact.message.slice(0,180)}{contact.message.length>180?"…":""}</td><td><span className={`status-pill ${contact.status}`}>{contact.status.replace("_"," ")}</span><form action={updateContactStatus} className="inline-form" style={{marginTop:8}}><input type="hidden" name="id" value={contact.id}/><select name="status" defaultValue={contact.status}><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="spam">Spam</option></select><button className="small-button">Save</button></form></td></tr>)}
        </tbody></table>{contacts.length===0&&<p className="admin-empty">No enquiries yet. New website messages will appear here.</p>}</div>
      </section>
    </section>
  </main>;
}
