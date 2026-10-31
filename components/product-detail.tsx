import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { ProductGallery } from "@/components/product-gallery";
import { deleteProduct, updateCatalogStatus } from "@/app/admin/dashboard/actions";
export async function ProductDetail({id,error,saved}:{id:string;error?:string;saved?:string}) {
 const {supabase,user}=await requireAdmin();
 const {data}=await supabase.from("products").select("id,name,model,status,description,category_id,categories(name),product_images(id,storage_path,alt_text,is_primary)").eq("id",id).maybeSingle();
 if(!data)return h("p",null,"Product not found.");
 const photos=data.product_images??[];
 return h(WorkflowLayout,{title:"Product details",description:"Review the product and manage its image gallery.",email:user.email,activePath:"/admin/products",error,saved},
  h("section",{className:"admin-panel"},h("h2",null,data.name),h("p",null,"Model "+data.model+" · "+(data.categories?.name??"No category")),h("p",null,data.description||"No description."),h("p",null,"Status: "+data.status),h("div",{className:"admin-row-actions"},h(Link,{href:"/admin/products/edit?id="+data.id,className:"small-button"},"Edit product"),h("form",{action:updateCatalogStatus,className:"inline-form"},h("input",{type:"hidden",name:"table",value:"products"}),h("input",{type:"hidden",name:"id",value:data.id}),h("input",{type:"hidden",name:"return_to",value:"/admin/products/detail?id="+data.id}),h("input",{type:"hidden",name:"status",value:data.status==="active"?"inactive":"active"}),h("button",{className:"admin-secondary-button"},data.status==="active"?"Hide product":"Publish product")),h("form",{action:deleteProduct,className:"inline-form"},h("input",{type:"hidden",name:"id",value:data.id}),h("button",{className:"small-button button-danger"},"Delete product"))),
  h(ProductGallery,{productId:data.id,productName:data.name,photos}));
}
