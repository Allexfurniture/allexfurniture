import { createElement as h } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, publicImageUrl } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { deleteProjectImage, setPrimaryProjectImage, uploadMoreProjectImages } from "@/app/admin/dashboard/actions";
export default async function ProjectDetailsPage({searchParams}:{searchParams:Promise<{id?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;if(!p.id)notFound();const id=p.id;const {supabase,user}=await requireAdmin();
 const {data:project}=await supabase.from("projects").select("id,name,slug,description,status,project_images(id,storage_path,alt_text,is_primary)").eq("id",id).maybeSingle();if(!project)notFound();
 const photos=[...(project.project_images??[])].sort((a,b)=>Number(b.is_primary)-Number(a.is_primary));
 return h(WorkflowLayout,{title:"Project details",description:"Manage project content and gallery images.",email:user.email,activePath:"/admin/projects",error:p.error,saved:p.saved},
 h("div",{className:"admin-detail-toolbar"},h(Link,{href:"/admin/projects",className:"admin-text-link"},"← All projects"),h(Link,{href:"/admin/projects/edit?id="+id,className:"small-button"},"Edit project")),
 h("section",{className:"admin-panel"},h("h2",null,project.name),h("p",null,"/"+project.slug),h("p",{className:"admin-detail-description"},project.description||"No description has been added."),h("span",{className:"status-pill "+project.status},project.status)),
 h("section",{className:"admin-panel"},h("h2",null,"Project gallery"),photos.length?h("div",{className:"admin-image-grid"},...photos.map(photo=>h("article",{className:"admin-image-card "+(photo.is_primary?"is-primary":""),key:photo.id},publicImageUrl(photo.storage_path)?h("img",{src:publicImageUrl(photo.storage_path),alt:photo.alt_text??project.name}):h("div",{className:"admin-image-placeholder"},"Image"),h("strong",null,photo.is_primary?"Cover image":"Gallery image"),h("div",{className:"record-actions"},!photo.is_primary?h("form",{action:setPrimaryProjectImage},h("input",{type:"hidden",name:"project_id",value:id}),h("input",{type:"hidden",name:"image_id",value:photo.id}),h("button",{className:"small-button"},"Make cover")):null,h("form",{action:deleteProjectImage},h("input",{type:"hidden",name:"image_id",value:photo.id}),h("button",{className:"small-button button-danger"},"Delete image")))))):h("p",{className:"admin-empty"},"No gallery images yet."),
 h("form",{action:uploadMoreProjectImages,className:"admin-upload-card",encType:"multipart/form-data"},h("input",{type:"hidden",name:"project_id",value:id}),h("div",{className:"field"},h("label",{htmlFor:"project-image"},"Choose image"),h("input",{id:"project-image",type:"file",name:"image",required:true,accept:"image/jpeg,image/png,image/webp,image/gif"})),h("div",{className:"field"},h("label",{htmlFor:"project-alt"},"Alt text"),h("input",{id:"project-alt",name:"alt_text",maxLength:1000})),h("button",{className:"small-button",type:"submit"},"Upload image")));
}
