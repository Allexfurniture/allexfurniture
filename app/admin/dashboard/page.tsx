import { createElement as h } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
export const metadata: Metadata = { title: "Admin dashboard", robots: { index: false, follow: false, noarchive: true } };
export default async function AdminDashboard({searchParams}:{searchParams:Promise<{error?:string;saved?:string}>}) {
 const p=await searchParams;const {supabase,user}=await requireAdmin();
 const [products,categories,projects,contacts,recentProducts,recentContacts]=await Promise.all([
  supabase.from("products").select("id,status"),
  supabase.from("categories").select("id,status"),
  supabase.from("projects").select("id,status"),
  supabase.from("contacts").select("id,status"),
  supabase.from("products").select("id,name,model,status,created_at").order("created_at",{ascending:false}).limit(5),
  supabase.from("contacts").select("id,subject,status,created_at").order("created_at",{ascending:false}).limit(5)
 ]);
 const productRows=products.data??[],categoryRows=categories.data??[],projectRows=projects.data??[],contactRows=contacts.data??[];
 return h(WorkflowLayout,{title:"Dashboard",description:"A clear overview of the catalog and customer activity.",email:user.email,activePath:"/admin/dashboard",error:p.error,saved:p.saved},
 h("div",{className:"stat-grid"},
 h(Link,{className:"stat-card stat-card-link",href:"/admin/products"},h("span",null,"Products"),h("strong",null,productRows.length),h("small",null,productRows.filter(x=>x.status==="active").length+" published · Manage products ↗")),
 h(Link,{className:"stat-card stat-card-link",href:"/admin/categories"},h("span",null,"Categories"),h("strong",null,categoryRows.length),h("small",null,categoryRows.filter(x=>x.status==="active").length+" active · Manage categories ↗")),
 h(Link,{className:"stat-card stat-card-link",href:"/admin/projects"},h("span",null,"Projects"),h("strong",null,projectRows.length),h("small",null,projectRows.filter(x=>x.status==="active").length+" published · Manage projects ↗")),
 h(Link,{className:"stat-card stat-card-link",href:"/admin/enquiries"},h("span",null,"New enquiries"),h("strong",null,contactRows.filter(x=>x.status==="new").length),h("small",null,contactRows.length+" total · View enquiries ↗"))),
 h("section",{className:"admin-panel"},h(SectionHeading,{title:"Quick actions",description:"Open the dedicated page for the task you need."}),
 h("div",{className:"admin-quick-grid"},
 h(Link,{className:"admin-quick-card",href:"/admin/products/new"},h("span",null,"01"),h("strong",null,"Add a product"),h("small",null,"Create catalog details and add a first image."),"↗"),
 h(Link,{className:"admin-quick-card",href:"/admin/categories/new"},h("span",null,"02"),h("strong",null,"Add a category"),h("small",null,"Organize the catalog with parent and child categories."),"↗"),
 h(Link,{className:"admin-quick-card",href:"/admin/projects/new"},h("span",null,"03"),h("strong",null,"Create a project"),h("small",null,"Build a portfolio entry and manage its gallery."),"↗"),
 h(Link,{className:"admin-quick-card",href:"/admin/enquiries"},h("span",null,"04"),h("strong",null,"Review enquiries"),h("small",null,"Update customer enquiry workflow statuses."),"↗"))),
 h("div",{className:"admin-two-col"},
 h("section",{className:"admin-panel"},h(SectionHeading,{title:"Recent products",action:h(Link,{className:"admin-text-link",href:"/admin/products"},"View all ↗")}),...(recentProducts.data??[]).map(item=>h(Link,{key:item.id,className:"admin-simple-row",href:"/admin/products/detail?id="+item.id},h("span",null,h("strong",null,item.name),h("small",null,item.model+" · "+new Date(item.created_at).toLocaleDateString())),h("span",{className:"status-pill "+item.status},item.status)))),
 h("section",{className:"admin-panel"},h(SectionHeading,{title:"Recent enquiries",action:h(Link,{className:"admin-text-link",href:"/admin/enquiries"},"View all ↗")}),...(recentContacts.data??[]).map(item=>h(Link,{key:item.id,className:"admin-simple-row",href:"/admin/enquiries/detail?id="+item.id},h("span",null,h("strong",null,item.subject),h("small",null,new Date(item.created_at).toLocaleDateString())),h("span",{className:"status-pill "+item.status},item.status.replace("_"," ")))))));
}
