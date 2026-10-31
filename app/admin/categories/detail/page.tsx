import { createElement as h } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin, publicImageUrl, formatAdminDate } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
import { deleteCategory, uploadCategoryImage } from "@/app/admin/dashboard/actions";
export const metadata: Metadata = { title: "Category details · Admin", robots: { index: false, follow: false } };
export default async function CategoryDetailsPage({searchParams}:{searchParams:Promise<{id?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;if(!p.id)notFound();const id=p.id;const {supabase,user}=await requireAdmin();
 const [{data:category},{data:children},{data:products},{data:photo}]=await Promise.all([
  supabase.from("categories").select("id,name,slug,description,status,parent_id,created_at,updated_at").eq("id",id).maybeSingle(),
  supabase.from("categories").select("id,name,status").eq("parent_id",id).order("name"),
  supabase.from("products").select("id,name,model,status").eq("category_id",id).order("name"),
  supabase.from("category_images").select("id,storage_path,alt_text,updated_at").eq("category_id",id).maybeSingle()
 ]);
 if(!category)notFound();
 return h(WorkflowLayout,{title:"Category details",description:"Manage this category's image and inspect the products and child categories attached to it.",email:user.email,activePath:"/admin/categories",error:p.error,saved:p.saved},
  h("div",{className:"admin-detail-toolbar"},h(Link,{className:"admin-text-link",href:"/admin/categories"},"← All categories"),h("div",{className:"admin-row-actions"},h(Link,{className:"small-button",href:"/admin/categories/edit?id="+id},"Edit category"),h("span",{className:"status-pill "+category.status},category.status==="active"?"Published":"Hidden"))),
  h("section",{className:"admin-panel"},h("div",{className:"admin-detail-heading"},h("div",null,h("span",{className:"admin-record-kicker"},"CATEGORY SLUG"),h("h2",null,category.name),h("p",null,"/"+category.slug),h("p",{className:"admin-detail-description"},category.description||"No description has been added.")),h("dl",{className:"admin-facts"},h("div",null,h("dt",null,"Status"),h("dd",null,category.status)),h("div",null,h("dt",null,"Child categories"),h("dd",null,(children??[]).length)),h("div",null,h("dt",null,"Products"),h("dd",null,(products??[]).length)),h("div",null,h("dt",null,"Created"),h("dd",null,formatAdminDate(category.created_at))))),
  h("section",{className:"admin-panel"},h(SectionHeading,{title:"Category image",description:"Each category supports one image in the existing schema."}),
   photo&&publicImageUrl(photo.storage_path)?h("img",{className:"admin-category-image admin-category-image-large",src:publicImageUrl(photo.storage_path),alt:photo.alt_text??category.name}):h("div",{className:"admin-empty-state"},h("h3",null,"No category image"),h("p",null,"Upload a collection image to improve the storefront presentation.")),
   h("form",{action:uploadCategoryImage,className:"admin-upload-card",encType:"multipart/form-data"},h("input",{type:"hidden",name:"return_to",value:"/admin/categories/detail?id="+id}),h("input",{type:"hidden",name:"category_id",value:id}),h("div",{className:"field"},h("label",{htmlFor:"category-image"},"Choose image"),h("input",{id:"category-image",type:"file",name:"image",required:true,accept:"image/jpeg,image/png,image/webp,image/gif"})),h("div",{className:"field"},h("label",{htmlFor:"category-image-alt"},"Alt text"),h("input",{id:"category-image-alt",name:"alt_text",maxLength:1000,defaultValue:photo?.alt_text??""})),h("button",{className:"small-button admin-cta",type:"submit"},photo?"Replace image":"Upload image"))),
  h("section",{className:"admin-panel"},h(SectionHeading,{title:"Products in this category",description:"Products assigned directly to this category."}),h("div",{className:"admin-simple-list"},...(products??[]).map(item=>h(Link,{key:item.id,href:"/admin/products/detail?id="+item.id},h("span",null,h("strong",null,item.name),h("small",null,item.model)),h("span",{className:"status-pill "+item.status},item.status))))),
  h("section",{className:"admin-panel"},h(SectionHeading,{title:"Child categories"}),(children??[]).length?h("div",{className:"admin-simple-list"},...(children??[]).map(item=>h(Link,{key:item.id,href:"/admin/categories/detail?id="+item.id},h("span",null,h("strong",null,item.name)),h("span",{className:"status-pill "+item.status},item.status)))):h("p",{className:"admin-empty"},"No child categories."),
  h("section",{className:"admin-panel admin-danger-zone"},h("h2",null,"Delete category"),h("p",null,"The database will block deletion if this category still has products or child categories."),h("form",{action:deleteCategory},h("input",{type:"hidden",name:"return_to",value:"/admin/categories"}),h("input",{type:"hidden",name:"id",value:id}),h("button",{className:"small-button button-danger",type:"submit"},"Delete category"))));
}
