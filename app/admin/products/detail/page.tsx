import { createElement as h } from "react";
import { ProductDetail } from "@/components/product-detail";
export default async function ProductDetailsPage({searchParams}:{searchParams:Promise<{id?:string}>}) {
 const p=await searchParams;
 return h(ProductDetail,{id:p.id??""});
}
