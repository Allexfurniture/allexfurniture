import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { CategoryImageManager } from "@/components/category-image-manager";
import { deleteCategory, updateCatalogStatus } from "@/app/admin/dashboard/actions";

export default async function CategoryDetailsPage({ searchParams }: { searchParams: Promise<{ id?: string; error?: string; saved?: string }> }) {
  const p = await searchParams;
  const { supabase, user } = await requireAdmin();
  const { data: item } = await supabase.from("categories").select("id,name,slug,description,status,parent_id,category_images(storage_path,alt_text)").eq("id", p.id ?? "").maybeSingle();

  if (!item) return <WorkflowLayout title="Category not found" description="This category may have been removed." email={user.email} activePath="/admin/categories"><Link href="/admin/categories" className="small-button">Back to categories</Link></WorkflowLayout>;

  const parentPromise = item.parent_id ? supabase.from("categories").select("id,name").eq("id", item.parent_id).maybeSingle() : Promise.resolve({ data: null });
  const [{ data: parent }, { data: children }, { data: products }] = await Promise.all([
    parentPromise,
    supabase.from("categories").select("id,name,status").eq("parent_id", item.id).order("name"),
    supabase.from("products").select("id,name,model,status").eq("category_id", item.id).order("name")
  ]);
  const photo = Array.isArray(item.category_images) ? item.category_images[0] ?? null : item.category_images;
  const productRows = (products ?? []).map(product => <div key={product.id} className="admin-simple-row"><span><strong>{product.name}</strong><small>{product.model} · {product.status}</small></span><Link href={"/admin/products/detail?id=" + product.id} className="admin-text-link">View product</Link></div>);
  const childRows = (children ?? []).map(child => <div key={child.id} className="admin-simple-row"><strong>{child.name}</strong><Link href={"/admin/categories/detail?id=" + child.id} className="admin-text-link">View category</Link></div>);

  return <WorkflowLayout title="Category details" description="Review category relationships and manage its collection image." email={user.email} activePath="/admin/categories" error={p.error} saved={p.saved}>
    <div className="admin-detail-toolbar"><Link href="/admin/categories" className="admin-text-link">← All categories</Link></div>
    <section className="admin-panel">
      <div className="admin-record-heading"><div><h2>{item.name}</h2><p>/{item.slug}</p><p>{item.description || "No description."}</p></div><span className={"status-pill " + item.status}>{item.status}</span></div>
      <dl className="admin-facts"><div><dt>Parent category</dt><dd>{parent?.name ?? "Top level"}</dd></div><div><dt>Direct products</dt><dd>{products?.length ?? 0}</dd></div><div><dt>Child categories</dt><dd>{children?.length ?? 0}</dd></div></dl>
      <div className="admin-row-actions">
        <Link href={"/admin/categories/edit?id=" + item.id} className="small-button">Edit category</Link>
        <form action={updateCatalogStatus} className="inline-form"><input type="hidden" name="table" value="categories" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="return_to" value={"/admin/categories/detail?id=" + item.id} /><input type="hidden" name="status" value={item.status === "active" ? "inactive" : "active"} /><button className="admin-secondary-button">{item.status === "active" ? "Hide category" : "Publish category"}</button></form>
        <form action={deleteCategory} className="inline-form"><input type="hidden" name="id" value={item.id} /><button className="small-button button-danger">Delete category</button></form>
      </div>
      <h3>Products in this category</h3>{productRows.length ? <div className="admin-record-list">{productRows}</div> : <p className="admin-empty">No products assigned directly to this category.</p>}
      <h3>Subcategories</h3>{childRows.length ? <div className="admin-record-list">{childRows}</div> : <p className="admin-empty">No child categories.</p>}
    </section>
    <CategoryImageManager categoryId={item.id} name={item.name} photo={photo} />
  </WorkflowLayout>;
}
