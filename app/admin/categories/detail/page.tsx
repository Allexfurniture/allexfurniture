import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
export default async function CategoryDetailsPage({searchParams}:{searchParams:Promise<{id?:string}>}) {
 const p=await searchParams;const {supabase,user}=await requireAdmin();
 const {data:item}=await supabase.from("categories").select("id,name,slug,description,status").eq("id",p.id??"").maybeSingle();
 if(!item)return h(WorkflowLayout,{title:"Category details",description:"Category not found.",email:user.email,activePath:"/admin/categories"},h("p",null,"Category not found."));
 return h(WorkflowLayout,{title:"Category details",description:"Review this category and its catalog role.",email:user.email,activePath:"/admin/categories"},h("section",{className:"admin-panel"},h("h2",null,item.name),h("p",null,"/"+item.slug),h("p",null,item.description||"No description."),h("p",null,"Status: "+item.status),h(Link,{href:"/admin/categories/edit?id="+item.id,className:"small-button"},"Edit category")));
}
