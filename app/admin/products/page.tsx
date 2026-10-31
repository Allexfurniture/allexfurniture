import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
import { CatalogProducts } from "@/components/catalog-products";
export default async function ProductsPage({searchParams}:{searchParams:Promise<{q?:string;status?:string;category?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;const {user}=await requireAdmin();
 return h(WorkflowLayout,{title:"Products",description:"Manage product details, publication status and product images.",email:user.email,activePath:"/admin/products",error:p.error,saved:p.saved},
 h("section",{className:"admin-panel"},h(SectionHeading,{title:"Product catalog",description:"Each product has its own details, edit and image-management page.",action:h(Link,{href:"/admin/products/new",className:"small-button admin-cta"},"＋ Add product")}),h(CatalogProducts,{searchParams:p})));
}
