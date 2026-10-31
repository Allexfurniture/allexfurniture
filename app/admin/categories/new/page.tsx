import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { createCategory } from "@/app/admin/dashboard/actions";
export default async function NewCategoryPage() {
 const {supabase,user}=await requireAdmin();
 const {data}=await supabase.from("categories").select("id,name,status").eq("status","active").order("name");
 return h(WorkflowLayout,{title:"Add category",description:"Create a category or subcategory.",email:user.email,activePath:"/admin/categories"},
  h("section",{className:"admin-panel admin-form-panel"},
   h("form",{action:createCategory,className:"admin-form"},h("input",{type:"hidden",name:"return_to",value:"/admin/categories"}),
    h("div",{className:"field"},h("label",{htmlFor:"category-name"},"Category name *"),h("input",{id:"category-name",name:"name",required:true,maxLength:150})),
    h("div",{className:"field"},h("label",{htmlFor:"category-slug"},"Slug *"),h("input",{id:"category-slug",name:"slug",required:true,pattern:"[a-z0-9]+(-[a-z0-9]+)*"})),
    h("div",{className:"field"},h("label",{htmlFor:"category-parent"},"Parent category"),h("select",{id:"category-parent",name:"parent_id",defaultValue:""},h("option",{value:""},"Top level"),...(data??[]).map(c=>h("option",{key:c.id,value:c.id},c.name)))),
    h("div",{className:"field"},h("label",{htmlFor:"category-description"},"Description"),h("textarea",{id:"category-description",name:"description",maxLength:10000})),
    h("div",{className:"admin-form-actions"},h("button",{className:"small-button admin-cta",type:"submit"},"Create category"),h(Link,{className:"admin-secondary-button",href:"/admin/categories"},"Cancel")))));
}
