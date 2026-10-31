import { createElement as h } from "react";
import { requireAdmin } from "@/lib/admin-auth";
export async function CatalogProducts() {
 const {supabase}=await requireAdmin();
 const result=await supabase.from("products").select("id,name,model,status").order("created_at",{ascending:false}).limit(200);
 const rows=result.data??[];
 const cards=rows.map(row=>{
  const view=h("form",{action:"/admin/products/detail",method:"get"},h("input",{type:"hidden",name:"id",value:row.id}),h("button",{className:"small-button"},"View"));
  const edit=h("form",{action:"/admin/products/edit",method:"get"},h("input",{type:"hidden",name:"id",value:row.id}),h("button",{className:"admin-text-link"},"Edit"));
  return h("article",{key:row.id,className:"admin-record"},h("h3",null,row.name),h("p",null,row.model),h("span",{className:"status-pill "+row.status},row.status),h("div",{className:"admin-row-actions"},view,edit));
 });
 return rows.length?h("div",{className:"admin-record-list"},...cards):h("p",{className:"admin-empty"},"No products yet.");
}
