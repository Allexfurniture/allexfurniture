import Link from "next/link";
import { createElement } from "react";

const links = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/projects", label: "Projects & galleries" },
  { href: "/admin/enquiries", label: "Customer enquiries" },
];

export function AdminSidebar({ email, activePath = "/admin/dashboard" }: { email: string | null | undefined; activePath?: string }) {
  return createElement("aside", { className: "admin-sidebar" },
    createElement(Link, { href: "/", className: "brand" },
      createElement("span", { className: "brand-mark" }, "A."),
      createElement("span", null, "ALLEX", createElement("span", { className: "brand-light" }, "FURNITURE"))),
    createElement("p", { className: "admin-label" }, "WORKSPACE"),
    createElement("nav", { className: "admin-nav", "aria-label": "Admin navigation" },
      ...links.map((item) => createElement(Link, {
        key: item.href,
        className: activePath === item.href || (item.href !== "/admin/dashboard" && activePath.startsWith(item.href + "/")) ? "active" : "",
        href: item.href
      }, item.label))),
    createElement("div", { className: "admin-sidebar-bottom" }, "Signed in as", createElement("br"), createElement("strong", null, email || "Administrator"), createElement("br"), createElement("br"), "Allex Furniture · Admin"));
}
