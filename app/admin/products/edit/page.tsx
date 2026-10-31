import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { updateProduct } from "@/app/admin/dashboard/actions";
export default async function EditProductPage({searchParams}:{searchParams:Promise<{id?:string}>}) {
 const p=await searchParams;const id=p.id??"";const {supabase,user}=await requireAdmin();
 const [{data:item},{data:cats}]=await Promise.all([supabase.from("products").select("id,name,model,description,status,category_id").eq("id",id).maybeSingle(),supabase.from("categories").select("id,name").order("name")]);
 if(!item)return h("p",null,"Product not found.");
 const options=(cats??[]).map(c=>h("option",{key:c.id,value:c.id},c.name));
 const form=h("form",{action:updateProduct,className:"admin-form"},
  h("input",{type:"hidden",name:"id",value:id}),
  h("div",{className:"field"},h("label",null,"Product name"),h("input",{name:"name",required:true,defaultValue:item.name,maxLength:300})),
  h("div",{className:"field"},h("label",null,"Model number"),h("input",{name:"model",required:true,defaultValue:item.model,maxLength:100})),
  h("div",{className:"field"},h("label",null,"Category"),h("select",{name:"category_id",defaultValue:item.category_id},...options)),
  h("div",{className:"field"},h("label",null,"Description"),h("textarea",{name:"description",defaultValue:item.description??"",maxLength:50000})),
  h("div",{className:"field"},h("label",null,"Status"),h("select",{name:"status",defaultValue:item.status},h("option",{value:"active"},"Published"),h("option",{value:"inactive"},"Hidden"))),
  h("button",{className:"small-button",type:"submit"},"Save changes"));
 return h(WorkflowLayout,{title:"Edit product",description:"Update product details supported by the current database.",email:user.email,activePath:"/admin/products"},h("section",{className:"admin-panel"},h(Link,{href:"/admin/products/detail?id="+id,className:"admin-text-link"},"← Product details"),form));
}
