import { createElement as h } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin, publicImageUrl, formatAdminDate } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
export const metadata: Metadata = { title: "Products · Admin", robots: { index: false, follow: false } };
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; error?: string; saved?: string }> }) {
 const p = await searchParams; const q=(p.q??"").trim(); const status=["active","inactive"].includes(p.status??"")?p.status:"";
 const {supabase,user}=await requireAdmin();
 let query=supabase.from("products").select("id,name,model,status,created_at,categories(name),product_images(storage_path,is_primary)").order("created_at",{ascending:false}).limit(200);
 if(q) query=query.or("name.ilike.%"+q.replace(/[%,()]/g,"")+"%,model.ilike.%"+q.replace(/[%,()]/g,"")+"%");
 if(status) query=query.eq("status",status);
 const {data,error}=await query;
 const rows=data??[];
 const stats=await supabase.from("products").select("id,status");
 return h(WorkflowLayout,{title:"Products",description:"Manage the furniture catalog, product status, and product-specific images.",email:user.email,activePath:"/admin/products",error:p.error,saved:p.saved},
  h("section",{className:"admin-panel"},h(SectionHeading,{title:"Product catalog",description:"Up to 200 newest records per view. Open a product to manage its full record and gallery.",action:h(Link,{className:"small-button admin-cta",href:"/admin/products/new"},"＋ Add product")}),
   h("div",{className:"admin-filter-row"},h("div",{className:"admin-filter-summary"},h("strong",null,rows.length),h("span",null,"products shown"),h("span",{className:"admin-filter-muted"}," · ",(stats.data??[]).filter(x=>x.status==="active").length," published")),
    h("form",{className:"admin-filter-form",method:"get"},h("input",{name:"q",defaultValue:q,placeholder:"Search name or model","aria-label":"Search products"}),h("select",{name:"status",defaultValue:status,"aria-label":"Filter by status"},h("option",{value:""},"All statuses"),h("option",{value:"active"},"Published"),h("option",{value:"inactive"},"Hidden")),h("button",{className:"small-button",type:"submit"},"Filter"),h(Link,{className:"admin-text-link",href:"/admin/products"},"Reset"))),
   error?h("div",{className:"form-error"},error):null,
   error?null:null,
   h("div",{className:"admin-table-wrap"},h("table",{className:"admin-table admin-data-table"},h("thead",null,h("tr",null,h("th",null,"Product"),h("th",null,"Model"),h("th",null,"Category"),h("th",null,"Status"),h("th",null,"Added"),h("th",null,"Actions"))),
    h("tbody",null,...rows.map(item=>{const images=[...(item.product_images??[])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary));const img=images[0];return h("tr",{key:item.id},h("td",null,h("div",{className:"admin-product-cell"},img&&publicImageUrl(img.storage_path)?h("img",{src:publicImageUrl(img.storage_path),alt:item.name}):h("span",{className:"admin-mini-placeholder"},"A."),h("strong",null,item.name))),h("td",null,item.model),h("td",null,item.categories?.name??"—"),h("td",null,h("span",{className:"status-pill "+item.status},item.status==="active"?"Published":"Hidden")),h("td",null,formatAdminDate(item.created_at)),h("td",null,h("div",{className:"admin-row-actions"},h(Link,{className:"small-button",href:"/admin/products/"+item.id},"View"),h(Link,{className:"admin-text-link",href:"/admin/products/"+item.id+"/edit"},"Edit"))));}))))),
   error?null:(error?null:null),
   rows.length===0?h("div",{className:"admin-empty-state"},h("span",{className:"admin-empty-symbol"},"A."),h("h3",null,q||status?"No matching products":"Your catalog starts here"),h("p",null,q||status?"Try changing the search or status filter.":"Add the first product, assign a category, and upload its product images."),h(Link,{className:"small-button",href:"/admin/products/new"},"Add product ↗")):null,
   error?null:null));
}
