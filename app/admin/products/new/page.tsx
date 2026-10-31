import { createElement as h } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
import { createProduct } from "@/app/admin/dashboard/actions";
export const metadata: Metadata = { title: "Add product · Admin", robots: { index: false, follow: false } };
export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
 const p=await searchParams; const {supabase,user}=await requireAdmin();
 const {data:categories,error}=await supabase.from("categories").select("id,name,parent_id,status").eq("status","active").order("name");
 const cats=categories??[];
 return h(WorkflowLayout,{title:"Add product",description:"Create a product record using the fields supported by the current database.",email:user.email,activePath:"/admin/products",error:p.error,saved:p.saved},
  h("section",{className:"admin-panel admin-form-panel"},h(SectionHeading,{title:"Product information",description:"Name, model and category are required. Price and stock fields are not part of the current schema."}),
   error?h("div",{className:"form-error"},error):null,
   h("form",{action:createProduct,className:"admin-form",encType:"multipart/form-data"},
    h("input",{type:"hidden",name:"return_to",value:"/admin/products"}),
    h("div",{className:"form-grid"},h("div",{className:"field"},h("label",{htmlFor:"product-name"},"Product name *"),h("input",{id:"product-name",name:"name",required:true,maxLength:300,placeholder:"e.g. Italiano Bed"})),h("div",{className:"field"},h("label",{htmlFor:"product-model"},"Model number *"),h("input",{id:"product-model",name:"model",required:true,maxLength:100,placeholder:"AF-KB-001"}))),
    h("div",{className:"field"},h("label",{htmlFor:"product-category"},"Category *"),h("select",{id:"product-category",name:"category_id",required:true,defaultValue:""},h("option",{value:"",disabled:true},"Select a category"),...cats.map(c=>h("option",{key:c.id,value:c.id},c.name))),error?null:null),
    h("div",{className:"field"},h("label",{htmlFor:"product-description"},"Description"),h("textarea",{id:"product-description",name:"description",maxLength:50000,placeholder:"Materials, dimensions, finish and details"})),
    h("div",{className:"admin-form-section-title"},"Product image"),
    h("div",{className:"form-grid"},h("div",{className:"field"},h("label",{htmlFor:"product-image"},"Upload first image"),h("input",{id:"product-image",name:"image",type:"file",accept:"image/jpeg,image/png,image/webp,image/gif"}),h("small",{className:"field-help"},"Optional · JPG, PNG, WebP or GIF · maximum 3 MB · one image per upload. The first image becomes primary.")),h("div",{className:"field"},h("label",{htmlFor:"product-alt"},"Image alt text"),h("input",{id:"product-alt",name:"alt_text",maxLength:1000,placeholder:"Describe the product photo"}))),
    h("div",{className:"admin-form-actions"},h("button",{className:"small-button admin-cta",type:"submit"},"Create product"),h(Link,{className:"admin-secondary-button",href:"/admin/products"},"Cancel")))));
}
