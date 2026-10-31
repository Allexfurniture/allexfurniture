import { createElement, type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { logoutAdmin } from "@/app/admin/dashboard/actions";
export function WorkflowLayout({ title, description, email, activePath, error, saved, children }: { title: string; description: string; email?: string | null; activePath: string; error?: string; saved?: string; children?: ReactNode }) {
 return createElement("main",{className:"admin-layout"},createElement(AdminSidebar,{email,activePath}),createElement("section",{className:"admin-main"},createElement("header",{className:"admin-topbar"},createElement("div",null,createElement("p",null,"ALLEX FURNITURE · ADMIN WORKSPACE"),createElement("h1",null,title),createElement("p",{className:"admin-page-description"},description)),createElement("form",{action:logoutAdmin},createElement("button",{className:"admin-logout",type:"submit"},"Sign out ↗"))),error?createElement("div",{className:"form-error",role:"alert"},error):null,saved?createElement("div",{className:"form-success",role:"status"},saved):null,children));
}
export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
 return createElement("div",{className:"admin-page-heading"},createElement("div",null,createElement("h2",null,title),description?createElement("p",null,description):null),action);
}
