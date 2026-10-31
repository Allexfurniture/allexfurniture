import { createElement as h } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin, publicImageUrl, formatAdminDate } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
export const metadata: Metadata = { title: "Categories · Admin", robots: { index: false, follow: false } };
export default async function CategoriesPage({searchParams}:{searchParams:Promise<{q?:string;status?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;const q=(p.q??"").trim();const status=["active","inactive"].includes(p.status??"")?p.status:"";const {supabase,user}=await requireAdmin();
 let query=supabase.from("categories").select("id,name,slug,status,parent_id,created_at,category_images(storage_path,alt_text)").order("name").limit(200);
 if(q)query=query.or("name.ilike.%"+q.replace(/[%,()]/g,"")+"%,slug.ilike.%"+q.replace(/[%,()]/g,"")+"%");
 if(status)query=query.eq("status",status);
 const [{data,error},{data:allCats}]=await Promise.all([query,supabase.from("categories").select("id,name,parent_id").order("name")]);
 const rows=data??[];const names=new Map((allCats??[]).map(c=>[c.id,c.name]));
 function label(c:{id:string;name:string;parent_id:string|null}){const parts=[c.name];let parent=c.parent_id;const seen=new Set([c.id]);while(parent&&!seen.has(parent)){seen.add(parent);const next=(allCats??[]).find(x=>x.id===parent);if(!next)break;parts.unshift(next.name);parent=next.parent_id;}return parts.join(" / ");}
 return h(WorkflowLayout,{title:"Categories",description:"Organize products with the database-supported parent and child category hierarchy.",email:user.email,activePath:"/admin/categories",error:p.error,saved:p.saved},
  h("section",{className:"admin-panel"},h(SectionHeading,{title:"Category structure",description:"Category hierarchy is limited to three levels. Categories with products or child categories cannot be deleted.",action:h(Link,{className:"small-button admin-cta",href:"/admin/categories/new"},"＋ Add category")}),
   h("div",{className:"admin-filter-row"},h("div",{className:"admin-filter-summary"},h("strong",null,rows.length),h("span",null,"categories shown")),h("form",{className:"admin-filter-form",method:"get"},h("input",{name:"q",defaultValue:q,placeholder:"Search category or slug","aria-label":"Search categories"}),h("select",{name:"status",defaultValue:status,"aria-label":"Filter by status"},h("option",{value:""},"All statuses"),h("option",{value:"active"},"Published"),h("option",{value:"inactive"},"Hidden")),h("button",{className:"small-button"},"Filter"),h(Link,{className:"admin-text-link",href:"/admin/categories"},"Reset"))),
   error?h("div",{className:"form-error"},error):null,
   h("div",{className:"admin-table-wrap"},h("table",{className:"admin-table admin-data-table"},h("thead",null,h("tr",null,h("th",null,"Category"),h("th",null,"Parent"),h("th",null,"Slug"),h("th",null,"Status"),h("th",null,"Created"),h("th",null,"Actions"))),h("tbody",null,...rows.map(c=>{const image=c.category_images;return h("tr",{key:c.id},h("td",null,h("div",{className:"admin-product-cell"},image&&publicImageUrl(image.storage_path)?h("img",{src:publicImageUrl(image.storage_path),alt:image.alt_text??c.name}):h("span",{className:"admin-mini-placeholder"},"A."),h("strong",null,label(c)))),h("td",null(c.parent_id?names.get(c.parent_id):"Top level")),h("td",null,c.slug),h("td",null,h("span",{className:"status-pill "+c.status},c.status==="active"?"Published":"Hidden")),h("td",null,formatAdminDate(c.created_at)),h("td",null,h("div",{className:"admin-row-actions"},h(Link,{className:"small-button",href:"/admin/categories/detail?id="+c.id},"View"),h(Link,{className:"admin-text-link",href:"/admin/categories/edit?id="+c.id},"Edit"))));}))))),
   rows.length===0?h("div",{className:"admin-empty-state"},h("span",{className:"admin-empty-symbol"},"A."),h("h3",null,q||status?"No matching categories":"No categories yet"),h("p",null,"Create a category to organize your furniture catalog."),h(Link,{className:"small-button",href:"/admin/categories/new"},"Add category ↗")):null));
}
