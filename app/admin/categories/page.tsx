import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { CatalogCategories } from "@/components/catalog-categories";
export default async function CategoriesPage() {
 const {user}=await requireAdmin();
 const body=h("section",{className:"admin-panel"},h("h2",null,"Categories"),h(Link,{href:"/admin/categories/new",className:"small-button"},"Add category"),h(CatalogCategories));
 return h(WorkflowLayout,{title:"Categories",description:"Manage category hierarchy and images.",email:user.email,activePath:"/admin/categories"},body);
}
