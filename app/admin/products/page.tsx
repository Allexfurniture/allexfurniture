import { createElement as h } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
export default async function ProductsPage() { const {user}=await requireAdmin(); return h(WorkflowLayout,{title:"Products",description:"Manage the product catalog.",email:user.email,activePath:"/admin/products"},h("section",{className:"admin-panel"},h("h2",null,"Products"))); }
