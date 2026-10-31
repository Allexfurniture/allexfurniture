import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
export default async function CategoriesPage() {
 const {supabase,user}=await requireAdmin();
 const {data}=await supabase.from("categories").select("id,name,slug,status,parent_id,category_images(storage_path)").order("name").limit(200);
 const rows=data??[];
 return h(WorkflowLayout,{title:"Categories",description:"Manage category hierarchy and collection images.",email:user.email,activePath:"/admin/categories"},
 h("section",{className:"admin-panel"},h("div",{className:"admin-page-heading"},h("h2",null,"Category list"),h(Link,{href:"/admin/categories/new",className:"small-button"},"Add category")),
 rows.length?h("div",{className:"admin-table-wrap"},h("table",{className:"admin-table"},h("thead",null,h("tr",null,h("th",null,"Category"),h("th",null,"Slug"),h("th",null,"Status"),h("th",null,"Actions"))),h("tbody",null,...rows.map(c=>h("tr",{key:c.id},h("td",null,c.name),h("td",null,c.slug),h("td",null,h("span",{className:"status-pill "+c.status},c.status)),h("td",null,h(Link,{href:"/admin/categories/detail?id="+c.id,className:"small-button"},"View")," ",h(Link,{href:"/admin/categories/edit?id="+c.id,className:"admin-text-link"},"Edit")))))):h("div",{className:"admin-empty-state"},h("h3",null,"No categories yet"),h("p",null,"Create a category to organize the product catalog."),h(Link,{href:"/admin/categories/new",className:"small-button"},"Create category"))));
}
