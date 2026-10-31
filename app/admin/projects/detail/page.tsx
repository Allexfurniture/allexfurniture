import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { ProjectGallery } from "@/components/project-gallery";
import { deleteProject, updateCatalogStatus } from "@/app/admin/dashboard/actions";
export default async function ProjectDetailsPage({searchParams}:{searchParams:Promise<{id?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;const {supabase,user}=await requireAdmin();
 const {data:item}=await supabase.from("projects").select("id,name,slug,description,status,created_at,updated_at,project_images(id,storage_path,alt_text,is_primary)").eq("id",p.id??"").maybeSingle();
 if(!item)return h(WorkflowLayout,{title:"Project not found",description:"This project may have been removed.",email:user.email,activePath:"/admin/projects"},h(Link,{href:"/admin/projects",className:"small-button"},"Back to projects"));
 return h(WorkflowLayout,{title:"Project details",description:"Manage this project, its publication status and gallery.",email:user.email,activePath:"/admin/projects",error:p.error,saved:p.saved},
  h("div",{className:"admin-detail-toolbar"},h(Link,{href:"/admin/projects",className:"admin-text-link"},"← All projects")),
  h("section",{className:"admin-panel"},h("div",{className:"admin-record-heading"},h("div",null,h("h2",null,item.name),h("p",null,"/"+item.slug),h("p",null,item.description||"No description.")),h("span",{className:"status-pill "+item.status},item.status)),
   h("div",{className:"admin-row-actions"},h(Link,{href:"/admin/projects/edit?id="+item.id,className:"small-button"},"Edit project"),
    h("form",{action:updateCatalogStatus,className:"inline-form"},h("input",{type:"hidden",name:"table",value:"projects"}),h("input",{type:"hidden",name:"id",value:item.id}),h("input",{type:"hidden",name:"return_to",value:"/admin/projects/detail?id="+item.id}),h("input",{type:"hidden",name:"status",value:item.status==="active"?"inactive":"active"}),h("button",{className:"admin-secondary-button"},item.status==="active"?"Hide project":"Publish project")),
    h("form",{action:deleteProject,className:"inline-form"},h("input",{type:"hidden",name:"id",value:item.id}),h("button",{className:"small-button button-danger"},"Delete project")))),
  h(ProjectGallery,{projectId:item.id,projectName:item.name,photos:item.project_images??[]}));
}
