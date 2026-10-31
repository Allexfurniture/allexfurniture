import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin, publicImageUrl, formatAdminDate } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
export default async function ProjectsPage() {
 const {supabase,user}=await requireAdmin();
 const {data}=await supabase.from("projects").select("id,name,slug,status,created_at,project_images(storage_path,is_primary)").order("created_at",{ascending:false}).limit(200);
 const rows=data??[];
 return h(WorkflowLayout,{title:"Projects",description:"Manage portfolio projects and their image galleries.",email:user.email,activePath:"/admin/projects"},
  h("section",{className:"admin-panel"},h(SectionHeading,{title:"Project portfolio",description:"Each project has a separate detail page and gallery workflow.",action:h(Link,{className:"small-button admin-cta",href:"/admin/projects/new"},"＋ Add project")}),
   rows.length?h("div",{className:"admin-project-grid"},...rows.map(project=>{const cover=(project.project_images??[]).find(x=>x.is_primary)||(project.project_images??[])[0];return h("article",{className:"admin-project-card",key:project.id},cover&&publicImageUrl(cover.storage_path)?h("img",{src:publicImageUrl(cover.storage_path),alt:project.name}):h("div",{className:"admin-project-cover-placeholder"},"ALLEX / PROJECT"),h("div",{className:"admin-project-card-copy"},h("span",{className:"status-pill "+project.status},project.status),h("h3",null,project.name),h("p",null,"/"+project.slug),h("small",null,formatAdminDate(project.created_at)),h("div",{className:"admin-row-actions"},h(Link,{className:"small-button",href:"/admin/projects/detail?id="+project.id},"Manage gallery"),h(Link,{className:"admin-text-link",href:"/admin/projects/edit?id="+project.id},"Edit"))));})):h("div",{className:"admin-empty-state"},h("h3",null,"No projects yet"),h("p",null,"Create a project and add its gallery images from the project detail page."),h(Link,{className:"small-button",href:"/admin/projects/new"},"Create project ↗"))));
}
