import { createElement as h } from "react";
import { requireAdmin } from "@/lib/admin-auth";
export async function CatalogProducts() {
 const {supabase}=await requireAdmin();
 const result=await supabase.from("products").select("id,name,model,status").order("created_at",{ascending:false}).limit(200);
 const rows=result.data??[];
 const cards=rows.map(row=>h("article",{key:row.id,className:"admin-record"},h("h3",null,row.name),h("p",null,row.model),h("span",{className:"status-pill "+row.status},row.status)));
 return h("div",{className:"admin-record-list"},...cards);
}
