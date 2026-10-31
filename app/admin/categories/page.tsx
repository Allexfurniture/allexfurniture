import { createElement as h } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
export default async function CategoriesPage() {
 const {user}=await requireAdmin();
 return h(WorkflowLayout,{title:"Categories",description:"Manage categories.",email:user.email,activePath:"/admin/categories"},h("section",{className:"admin-panel"},h("h2",null,"Categories")));
}
