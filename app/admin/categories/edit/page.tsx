import { createElement as h } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
import { updateCategory } from "@/app/admin/dashboard/actions";
export const metadata: Metadata = { title: "Edit category · Admin", robots: { index: false, follow: false } };
export default async function EditCategoryPage({searchParams}:{searchParams:Promise<{id?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;if(!p.id)notFound();const id=p.id;const {supabase,user}=await requireAdmin();
 const [{data:category},{data:categories}]=await Promise.all([supabase.from("categories").select("id,name,slug,description,status,parent_id").eq("id",id).maybeSingle(),supabase.from("categories").select("id,name,status").order("name")]);
 if(!category)notFound();
 return h(WorkflowLayout,{title:"Edit category",description:"Update category details while preserving the existing hierarchy constraints.",email:user.email,activePath:"/admin/categories",error:p.error,saved:p.saved},
  h("section",{className:"admin-panel admin-form-panel"},h("div",{className:"admin-detail-toolbar"},h(Link,{className:"admin-text-link",href:"/admin/categories/detail?id="+id},"← Category details")),h(SectionHeading,{title:category.name,description:"The database prevents invalid parent-child cycles and duplicate slugs."}),
   h("form",{action:updateCategory,className:"admin-form"},h("input",{type:"hidden",name:"return_to",value:"/admin/categories"}),h("input",{type:"hidden",name:"id",value:id}),
    h("div",{className:"form-grid"},h("div",{className:"field"},h("label",{htmlFor:"category-name"},"Category name *"),h("input",{id:"category-name",name:"name",required:true,maxLength:150,defaultValue:category.name})),h("div",{className:"field"},h("label",{htmlFor:"category-slug"},"Slug *"),h("input",{id:"category-slug",name:"slug",required:true,pattern:"[a-z0-9]+(-[a-z0-9]+)*",defaultValue:category.slug}))),
    h("div",{className:"field"},h("label",{htmlFor:"category-parent"},"Parent category"),h("select",{id:"category-parent",name:"parent_id",defaultValue:category.parent_id??""},h("option",{value:""},"Top-level category"),...(categories??[]).filter(c=>c.id!==id&&c.status==="active").map(c=>h("option",{key:c.id,value:c.id},c.name)))),
    h("div",{className:"field"},h("label",{htmlFor:"category-description"},"Description"),h("textarea",{id:"category-description",name:"description",maxLength:10000,defaultValue:category.description??""})),
    h("div",{className:"field"},h("label",{htmlFor:"category-status"},"Publication status"),h("select",{id:"category-status",name:"status",defaultValue:category.status},h("option",{value:"active"},"Published"),h("option",{value:"inactive"},"Hidden"))),
    h("div",{className:"admin-form-actions"},h("button",{className:"small-button admin-cta",type:"submit"},"Save changes"),h(Link,{className:"admin-secondary-button",href:"/admin/categories/detail?id="+id},"Cancel")))));
}
