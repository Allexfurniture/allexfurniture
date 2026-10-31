import { createElement as h } from "react";
import { requireAdmin } from "@/lib/admin-auth";
export async function CatalogCategories() {
 const {supabase}=await requireAdmin();
 const result=await supabase.from("categories").select("id,name,slug,status,parent_id").order("name").limit(200);
 const rows=result.data??[];
 const cards=rows.map(row=>{
  const view=h("form",{action:"/admin/categories/detail",method:"get"},h("input",{type:"hidden",name:"id",value:row.id}),h("button",{className:"small-button"},"View"));
  const edit=h("form",{action:"/admin/categories/edit",method:"get"},h("input",{type:"hidden",name:"id",value:row.id}),h("button",{className:"admin-text-link"},"Edit"));
  return h("article",{key:row.id,className:"admin-record"},h("div",{className:"admin-record-heading"},h("div",null,h("h3",null,row.name),h("p",null,"/"+row.slug)),h("span",{className:"status-pill "+row.status},row.status)),h("div",{className:"admin-row-actions"},view,edit));
 });
 return rows.length?h("div",{className:"admin-record-list"},...cards):h("p",{className:"admin-empty"},"No categories yet.");
}
