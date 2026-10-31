import { createElement as h } from "react";
import { publicImageUrl } from "@/lib/admin-auth";
import { deleteProductImage, setPrimaryProductImage, uploadMoreProductImages } from "@/app/admin/dashboard/actions";
type Photo={id:string;storage_path:string;alt_text:string|null;is_primary:boolean};
export function ProductGallery({productId,productName,photos}:{productId:string;productName:string;photos:Photo[]}) {
 const cards=photos.map(photo=>{
  const img=publicImageUrl(photo.storage_path)?h("img",{src:publicImageUrl(photo.storage_path),alt:photo.alt_text??productName}):h("div",{className:"admin-image-placeholder"},"Image");
  const primaryForm=photo.is_primary?null:h("form",{action:setPrimaryProductImage},h("input",{type:"hidden",name:"product_id",value:productId}),h("input",{type:"hidden",name:"image_id",value:photo.id}),h("button",{className:"small-button"},"Make primary"));
  const deleteForm=h("form",{action:deleteProductImage},h("input",{type:"hidden",name:"image_id",value:photo.id}),h("button",{className:"small-button button-danger"},"Delete image"));
  return h("article",{className:"admin-image-card",key:photo.id},img,h("p",null,photo.is_primary?"Primary image":"Product image"),h("small",null,photo.alt_text||""),h("div",{className:"record-actions"},primaryForm,deleteForm));
 });
 const upload=h("form",{action:uploadMoreProductImages,className:"admin-upload-card",encType:"multipart/form-data"},h("input",{type:"hidden",name:"product_id",value:productId}),h("div",{className:"field"},h("label",null,"Choose image"),h("input",{type:"file",name:"image",required:true,accept:"image/jpeg,image/png,image/webp,image/gif"})),h("div",{className:"field"},h("label",null,"Alt text"),h("input",{name:"alt_text",maxLength:1000})),h("button",{className:"small-button",type:"submit"},"Upload image"));
 return h("section",{className:"admin-panel"},h("h2",null,"Product images"),cards.length?h("div",{className:"admin-image-grid"},...cards):h("p",{className:"admin-empty"},"No images yet."),upload);
}
