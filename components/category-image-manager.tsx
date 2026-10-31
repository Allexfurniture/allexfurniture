import { createElement as h } from "react";
import { publicImageUrl } from "@/lib/admin-auth";
import { uploadCategoryImage } from "@/app/admin/dashboard/actions";
export function CategoryImageManager({categoryId,name,photo}:{categoryId:string;name:string;photo:{storage_path:string;alt_text:string|null}|null}) {
 const preview=photo?h("img",{src:publicImageUrl(photo.storage_path),alt:photo.alt_text??name,className:"admin-category-image-large"}):h("p",null,"No image uploaded.");
 const form=h("form",{action:uploadCategoryImage,encType:"multipart/form-data"},h("input",{type:"hidden",name:"category_id",value:categoryId}),h("input",{type:"file",name:"image",required:true,accept:"image/jpeg,image/png,image/webp,image/gif"}),h("input",{name:"alt_text",defaultValue:photo?.alt_text??""}),h("button",{className:"small-button"},"Save image"));
 return h("section",{className:"admin-panel"},h("h2",null,"Category image"),preview,form);
}
