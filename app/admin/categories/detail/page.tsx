import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { CategoryImageManager } from "@/components/category-image-manager";
export default async function CategoryDetailsPage({searchParams}:{searchParams:Promise<{id?:string}>}) {
 const p=await searchParams;const {supabase,user}=await requireAdmin();
 const {data:item}=await supabase.from("categories").select("id,name,slug,description,status,category_images(storage_path,alt_text)").eq("id",p.id??"").maybeSingle();
 if(!item)return h("p",null,"Category not found.");
 const photo=Array.isArray(item.category_images)?item.category_images[0]??null:item.category_images;
 return h(WorkflowLayout,{title:"Category details",description:"Review this category and manage its collection image.",email:user.email,activePath:"/admin/categories"},
  h("section",{className:"admin-panel"},h("h2",null,item.name),h("p",null,"/"+item.slug),h("p",null,item.description||"No description."),h("p",null,"Status: "+item.status),h(Link,{href:"/admin/categories/edit?id="+item.id,className:"small-button"},"Edit category")),
  h(CategoryImageManager,{categoryId:item.id,name:item.name,photo}));
}
