import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { ProjectGallery } from "@/components/project-gallery";
export default async function ProjectDetailsPage({searchParams}:{searchParams:Promise<{id?:string}>}) {
 const p=await searchParams;const {supabase,user}=await requireAdmin();
 const {data:item}=await supabase.from("projects").select("id,name,slug,description,status,project_images(id,storage_path,alt_text,is_primary)").eq("id",p.id??"").maybeSingle();
 if(!item)return h("p",null,"Project not found.");
 return h(WorkflowLayout,{title:"Project details",description:"Manage this project and its gallery.",email:user.email,activePath:"/admin/projects"},
  h("section",{className:"admin-panel"},h("h2",null,item.name),h("p",null,"/"+item.slug),h("p",null,item.description||"No description."),h("p",null,"Status: "+item.status),h(Link,{href:"/admin/projects/edit?id="+item.id,className:"small-button"},"Edit project")),
  h(ProjectGallery,{projectId:item.id,projectName:item.name,photos:item.project_images??[]}));
}
