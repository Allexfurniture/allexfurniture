import { createElement as h } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
import { updateProduct } from "@/app/admin/dashboard/actions";
export const metadata: Metadata = { title: "Edit product · Admin", robots: { index: false, follow: false } };
export default async function EditProductPage({searchParams}:{searchParams:Promise<{id?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;if(!p.id)notFound();const id=p.id;const {supabase,user}=await requireAdmin();
 const [{data:product},{data:categories}]=await Promise.all([supabase.from("products").select("id,name,model,description,status,category_id,updated_at").eq("id",id).maybeSingle(),supabase.from("categories").select("id,name,status").order("name")]);
 if(!product)notFound();
 return h(WorkflowLayout,{title:"Edit product",description:"Update only the fields available in the current products table.",email:user.email,activePath:"/admin/products",error:p.error,saved:p.saved},
  h("section",{className:"admin-panel admin-form-panel"},h("div",{className:"admin-detail-toolbar"},h(Link,{className:"admin-text-link",href:"/admin/products/detail?id="+id},"← Product details")),
   h(SectionHeading,{title:product.name,description:"Model numbers must remain unique. Category hierarchy and status are validated by the database."}),
   h("form",{action:updateProduct,className:"admin-form"},h("input",{type:"hidden",name:"return_to",value:"/admin/products/edit?id="+id}),h("input",{type:"hidden",name:"id",value:id}),
    h("div",{className:"form-grid"},h("div",{className:"field"},h("label",{htmlFor:"edit-product-name"},"Product name *"),h("input",{id:"edit-product-name",name:"name",required:true,maxLength:300,defaultValue:product.name})),h("div",{className:"field"},h("label",{htmlFor:"edit-product-model"},"Model number *"),h("input",{id:"edit-product-model",name:"model",required:true,maxLength:100,defaultValue:product.model}))),
    h("div",{className:"field"},h("label",{htmlFor:"edit-product-category"},"Category *"),h("select",{id:"edit-product-category",name:"category_id",required:true,defaultValue:product.category_id},...(categories??[]).map(c=>h("option",{key:c.id,value:c.id},c.name+(c.status==="inactive"?" (hidden)":"")))),
    h("div",{className:"field"},h("label",{htmlFor:"edit-product-description"},"Description"),h("textarea",{id:"edit-product-description",name:"description",maxLength:50000,defaultValue:product.description??""})),
    h("div",{className:"field"},h("label",{htmlFor:"edit-product-status"},"Publication status"),h("select",{id:"edit-product-status",name:"status",defaultValue:product.status},h("option",{value:"active"},"Published"),h("option",{value:"inactive"},"Hidden"))),
    h("div",{className:"admin-form-actions"},h("button",{className:"small-button admin-cta",type:"submit"},"Save changes"),h(Link,{className:"admin-secondary-button",href:"/admin/products/detail?id="+id},"Cancel")))));
}
