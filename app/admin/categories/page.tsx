import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
import { CatalogCategories } from "@/components/catalog-categories";
export default async function CategoriesPage({searchParams}:{searchParams:Promise<{q?:string;status?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;const {user}=await requireAdmin();
 return h(WorkflowLayout,{title:"Categories",description:"Manage the category tree, visibility and category images.",email:user.email,activePath:"/admin/categories",error:p.error,saved:p.saved},
 h("section",{className:"admin-panel"},h(SectionHeading,{title:"Category hierarchy",description:"Parent and child categories are validated by the existing database rules.",action:h(Link,{href:"/admin/categories/new",className:"small-button admin-cta"},"＋ Add category")}),h(CatalogCategories,{searchParams:p})));
}
