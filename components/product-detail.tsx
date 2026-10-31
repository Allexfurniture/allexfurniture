import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { ProductGallery } from "@/components/product-gallery";
import { deleteProduct, updateCatalogStatus } from "@/app/admin/dashboard/actions";

export async function ProductDetail({ id, error, saved }: { id: string; error?: string; saved?: string }) {
  const { supabase, user } = await requireAdmin();
  const { data } = await supabase.from("products").select("id,name,model,status,description,category_id,categories(name),product_images(id,storage_path,alt_text,is_primary)").eq("id", id).maybeSingle();
  if (!data) return <WorkflowLayout title="Product not found" description="This product may have been removed." email={user.email} activePath="/admin/products"><Link href="/admin/products" className="small-button">Back to products</Link></WorkflowLayout>;

  const photos = data.product_images ?? [];
  return <WorkflowLayout title="Product details" description="Review the product and manage its image gallery." email={user.email} activePath="/admin/products" error={error} saved={saved}>
    <section className="admin-panel">
      <div className="admin-record-heading"><div><h2>{data.name}</h2><p>Model {data.model} · {data.categories?.name ?? "No category"}</p><p>{data.description || "No description."}</p></div><span className={"status-pill " + data.status}>{data.status}</span></div>
      <div className="admin-row-actions">
        <Link href={"/admin/products/edit?id=" + data.id} className="small-button">Edit product</Link>
        <form action={updateCatalogStatus} className="inline-form"><input type="hidden" name="table" value="products" /><input type="hidden" name="id" value={data.id} /><input type="hidden" name="return_to" value={"/admin/products/detail?id=" + data.id} /><input type="hidden" name="status" value={data.status === "active" ? "inactive" : "active"} /><button className="admin-secondary-button">{data.status === "active" ? "Hide product" : "Publish product"}</button></form>
        <form action={deleteProduct} className="inline-form"><input type="hidden" name="id" value={data.id} /><button className="small-button button-danger">Delete product</button></form>
      </div>
    </section>
    <ProductGallery productId={data.id} productName={data.name} photos={photos} />
  </WorkflowLayout>;
}
