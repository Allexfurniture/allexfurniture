import { createElement as h } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
export async function ProductDetail({id}:{id:string}) {
 const {supabase,user}=await requireAdmin();
 const {data}=await supabase.from("products").select("name,model,status,description").eq("id",id).maybeSingle();
 if(!data)return h("p",null,"Product not found.");
 return h(WorkflowLayout,{title:"Product details",description:"Review product information.",email:user.email,activePath:"/admin/products"},h("section",{className:"admin-panel"},h("h2",null,data.name),h("p",null,"Model "+data.model),h("p",null,data.description||"No description."),h("p",null,"Status: "+data.status)));
}
