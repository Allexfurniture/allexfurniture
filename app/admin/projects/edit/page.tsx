import { createElement as h } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { updateProject } from "@/app/admin/dashboard/actions";
export default async function EditProjectPage({searchParams}:{searchParams:Promise<{id?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;if(!p.id)notFound();const id=p.id;const {supabase,user}=await requireAdmin();
 const {data:project}=await supabase.from("projects").select("id,name,slug,description,status").eq("id",id).maybeSingle();if(!project)notFound();
 return h(WorkflowLayout,{title:"Edit project",description:"Update project information and publication status.",email:user.email,activePath:"/admin/projects",error:p.error,saved:p.saved},
 h("section",{className:"admin-panel admin-form-panel"},h(Link,{href:"/admin/projects/detail?id="+id,className:"admin-text-link"},"← Project details"),
 h("form",{action:updateProject,className:"admin-form"},h("input",{type:"hidden",name:"return_to",value:"/admin/projects"}),h("input",{type:"hidden",name:"id",value:id}),
 h("div",{className:"form-grid"},h("div",{className:"field"},h("label",{htmlFor:"project-name"},"Project name *"),h("input",{id:"project-name",name:"name",required:true,maxLength:200,defaultValue:project.name})),h("div",{className:"field"},h("label",{htmlFor:"project-slug"},"Slug *"),h("input",{id:"project-slug",name:"slug",required:true,pattern:"[a-z0-9]+(-[a-z0-9]+)*",defaultValue:project.slug}))),
 h("div",{className:"field"},h("label",{htmlFor:"project-description"},"Description"),h("textarea",{id:"project-description",name:"description",maxLength:50000,defaultValue:project.description??""})),
 h("div",{className:"field"},h("label",{htmlFor:"project-status"},"Publication status"),h("select",{id:"project-status",name:"status",defaultValue:project.status},h("option",{value:"active"},"Published"),h("option",{value:"inactive"},"Hidden"))),
 h("div",{className:"admin-form-actions"},h("button",{className:"small-button admin-cta",type:"submit"},"Save changes"),h(Link,{href:"/admin/projects/detail?id="+id,className:"admin-secondary-button"},"Cancel")))));
}
