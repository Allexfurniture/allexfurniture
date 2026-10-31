import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin, publicImageUrl } from "@/lib/admin-auth";
import { deleteProduct, updateCatalogStatus } from "@/app/admin/dashboard/actions";

type SearchParams = { q?: string; status?: string; category?: string };
export async function CatalogProducts({ searchParams = {} }: { searchParams?: SearchParams }) {
 const {supabase}=await requireAdmin();
 const [{data:products},{data:categories}]=await Promise.all([
  supabase.from("products").select("id,name,model,status,category_id,created_at,product_images(storage_path,is_primary),categories(name)").order("created_at",{ascending:false}).limit(500),
  supabase.from("categories").select("id,name").order("name")
 ]);
 const q=(searchParams.q??"").trim().toLowerCase(),status=searchParams.status??"all",category=searchParams.category??"all";
 const rows=(products??[]).filter(row=>(!q||row.name.toLowerCase().includes(q)||row.model.toLowerCase().includes(q))&&(status==="all"||row.status===status)&&(category==="all"||row.category_id===category));
 return h("div",null,
  h("div",{className:"admin-filter-row"},
   h("form",{method:"get",action:"/admin/products",className:"admin-filter-form"},
    h("input",{type:"search",name:"q",placeholder:"Search name or model",defaultValue:searchParams.q??""}),
    h("select",{name:"status",defaultValue:status},h("option",{value:"all"},"All statuses"),h("option",{value:"active"},"Published"),h("option",{value:"inactive"},"Hidden")),
    h("select",{name:"category",defaultValue:category},h("option",{value:"all"},"All categories"),...(categories??[]).map(c=>h("option",{key:c.id,value:c.id},c.name))),
    h("button",{className:"small-button",type:"submit"},"Filter"),
    h(Link,{className:"admin-secondary-button",href:"/admin/products"},"Reset")),
   h("span",{className:"admin-count-badge"},rows.length+" products")),
  rows.length?h("div",{className:"admin-record-list"},...rows.map(row=>{
   const images=row.product_images??[],cover=images.find(x=>x.is_primary)||images[0];
   const categoryName=Array.isArray(row.categories)?row.categories[0]?.name:row.categories?.name;
   return h("article",{key:row.id,className:"admin-record"},
    h("div",{className:"admin-record-heading"},
     h("div",{className:"admin-product-cell"},cover?.storage_path&&publicImageUrl(cover.storage_path)?h("img",{src:publicImageUrl(cover.storage_path),alt:row.name}):h("div",{className:"admin-mini-placeholder"},"IMG"),
      h("div",null,h("h3",null,row.name),h("p",null,row.model+" · "+(categoryName??"No category")),h("small",null,images.length+" image"+(images.length===1?"":"s")))),
     h("span",{className:"status-pill "+row.status},row.status)),
    h("div",{className:"admin-row-actions"},
     h(Link,{className:"small-button",href:"/admin/products/detail?id="+row.id},"View & images"),
     h(Link,{className:"admin-secondary-button",href:"/admin/products/edit?id="+row.id},"Edit"),
     h("form",{action:updateCatalogStatus,className:"inline-form"},h("input",{type:"hidden",name:"table",value:"products"}),h("input",{type:"hidden",name:"id",value:row.id}),h("input",{type:"hidden",name:"return_to",value:"/admin/products"}),h("input",{type:"hidden",name:"status",value:row.status==="active"?"inactive":"active"}),h("button",{className:"admin-secondary-button",type:"submit"},row.status==="active"?"Hide":"Publish")),
     h("form",{action:deleteProduct,className:"inline-form"},h("input",{type:"hidden",name:"id",value:row.id}),h("button",{className:"small-button button-danger",type:"submit"},"Delete"))));
  })):h("div",{className:"admin-empty-state"},h("h3",null,"No matching products"),h("p",null,"Try a different search or create a product."),h(Link,{className:"small-button",href:"/admin/products/new"},"Add product ↗")));
}
