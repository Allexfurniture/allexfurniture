import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteCategory, updateCatalogStatus } from "@/app/admin/dashboard/actions";
type SearchParams = { q?: string; status?: string };
export async function CatalogCategories({searchParams={}}:{searchParams?:SearchParams}) {
 const {supabase}=await requireAdmin();
 const result=await supabase.from("categories").select("id,name,slug,status,parent_id,created_at").order("name").limit(500);
 const all=result.data??[],byId=new Map(all.map(row=>[row.id,row]));
 const q=(searchParams.q??"").trim().toLowerCase(),status=searchParams.status??"all";
 const rows=all.filter(row=>(!q||row.name.toLowerCase().includes(q)||row.slug.toLowerCase().includes(q))&&(status==="all"||row.status===status));
 return h("div",null,
  h("div",{className:"admin-filter-row"},h("form",{method:"get",action:"/admin/categories",className:"admin-filter-form"},
   h("input",{type:"search",name:"q",placeholder:"Search category or slug",defaultValue:searchParams.q??""}),
   h("select",{name:"status",defaultValue:status},h("option",{value:"all"},"All statuses"),h("option",{value:"active"},"Published"),h("option",{value:"inactive"},"Hidden")),
   h("button",{className:"small-button",type:"submit"},"Filter"),h(Link,{className:"admin-secondary-button",href:"/admin/categories"},"Reset")),
   h("span",{className:"admin-count-badge"},rows.length+" categories")),
  rows.length?h("div",{className:"admin-record-list"},...rows.map(row=>{
   const parent=row.parent_id?byId.get(row.parent_id):null;
   return h("article",{key:row.id,className:"admin-record"},
    h("div",{className:"admin-record-heading"},h("div",null,h("h3",null,row.name),h("p",null,"/"+row.slug),h("small",null,parent?"Child of "+parent.name:"Top-level category")),h("span",{className:"status-pill "+row.status},row.status)),
    h("div",{className:"admin-row-actions"},h(Link,{className:"small-button",href:"/admin/categories/detail?id="+row.id},"View & image"),h(Link,{className:"admin-secondary-button",href:"/admin/categories/edit?id="+row.id},"Edit"),
     h("form",{action:updateCatalogStatus,className:"inline-form"},h("input",{type:"hidden",name:"table",value:"categories"}),h("input",{type:"hidden",name:"id",value:row.id}),h("input",{type:"hidden",name:"return_to",value:"/admin/categories"}),h("input",{type:"hidden",name:"status",value:row.status==="active"?"inactive":"active"}),h("button",{className:"admin-secondary-button",type:"submit"},row.status==="active"?"Hide":"Publish")),
     h("form",{action:deleteCategory,className:"inline-form"},h("input",{type:"hidden",name:"id",value:row.id}),h("button",{className:"small-button button-danger",type:"submit"},"Delete"))));
  })):h("div",{className:"admin-empty-state"},h("h3",null,"No matching categories"),h("p",null,"Try another search or add a category."),h(Link,{className:"small-button",href:"/admin/categories/new"},"Add category ↗")));
}
