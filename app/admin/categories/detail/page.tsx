import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { CategoryImageManager } from "@/components/category-image-manager";
import { deleteCategory, updateCatalogStatus } from "@/app/admin/dashboard/actions";
export default async function CategoryDetailsPage({searchParams}:{searchParams:Promise<{id?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;const {supabase,user}=await requireAdmin();
 const {data:item}=await supabase.from("categories").select("id,name,slug,description,status,parent_id,category_images(storage_path,alt_text)").eq("id",p.id??"").maybeSingle();
 if(!item)return h(WorkflowLayout,{title:"Category not found",description:"This category may have been removed.",email:user.email,activePath:"/admin/categories"},h(Link,{href:"/admin/categories",className:"small-button"},"Back to categories"));
 const [{data:parent},{data:children},{data:products}]=await Promise.all([
  item.parent_id?supabase.from("categories").select("id,name").eq("id",item.parent_id).maybeSingle():Promise.resolve({data:null}),
  supabase.from("categories").select("id,name").eq("parent_id",item.id),
  supabase.from("products").select("id,name,model,status").eq("category_id",item.id).order("name")
 ]);
 const photo=Array.isArray(item.category_images)?item.category_images[0]??null:item.category_images;
 return h(WorkflowLayout,{title:"Category details",description:"Review category relationships and manage its collection image.",email:user.email,activePath:"/admin/categories",error:p.error,saved:p.saved},
  h("div",{className:"admin-detail-toolbar"},h(Link,{href:"/admin/categories",className:"admin-text-link"},"← All categories")),
  h("section",{className:"admin-panel"},h("div",{className:"admin-record-heading"},h("div",null,h("h2",null,item.name),h("p",null,"/"+item.slug),h("p",null,item.description||"No description.")),h("span",{className:"status-pill "+item.status},item.status)),
   h("dl",{className:"admin-facts"},h("div",null,h("dt",null,"Parent category"),h("dd",null,parent?.name??"Top level")),h("div",null,h("dt",null,"Direct products"),h("dd",null,String(products?.length??0))),h("div",null,h("dt",null,"Child categories"),h("dd",null,String(children?.length??0)))),
   h("div",{className:"admin-row-actions"},h(Link,{href:"/admin/categories/edit?id="+item.id,className:"small-button"},"Edit category"),
    h("form",{action:updateCatalogStatus,className:"inline-form"},h("input",{type:"hidden",name:"table",value:"categories"}),h("input",{type:"hidden",name:"id",value:item.id}),h("input",{type:"hidden",name:"return_to",value:"/admin/categories/detail?id="+item.id}),h("input",{type:"hidden",name:"status",value:item.status==="active"?"inactive":"active"}),h("button",{className:"admin-secondary-button"},item.status==="active"?"Hide category":"Publish category")),
    h("form",{action:deleteCategory,className:"inline-form"},h("input",{type:"hidden",name:"id",value:item.id}),h("button",{className:"small-button button-danger"},"Delete category"))),
   h("h3",null,"Products in this category"),products?.length?h("div",{className:"admin-record-list"},...products.map(product=>h("div",{key:product.id,className:"admin-simple-row"},h("span",null,h("strong",null,product.name),h("small",null,product.model)),h(Link,{href:"/admin/products/detail?id="+product.id,className:"admin-text-link"},"View product"))):h("p",{className:"admin-empty"},"No products assigned directly to this category."),
   h("h3",null,"Subcategories"),children?.length?h("div",{className:"admin-record-list"},...children.map(child=>h("div",{key:child.id,className:"admin-simple-row"},h("strong",null,child.name),h(Link,{href:"/admin/categories/detail?id="+child.id,className:"admin-text-link"},"View category"))):h("p",{className:"admin-empty"},"No child categories.")),
  h(CategoryImageManager,{categoryId:item.id,name:item.name,photo}));
}
