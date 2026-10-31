import { createElement as h } from "react";
import { publicImageUrl } from "@/lib/admin-auth";
import { setPrimaryProjectImage, uploadMoreProjectImages } from "@/app/admin/dashboard/actions";
export function ProjectGallery({projectId,projectName,photos}:{projectId:string;projectName:string;photos:{id:string;storage_path:string;alt_text:string|null;is_primary:boolean}[]}) {
 const cards=photos.map(photo=>h("article",{className:"admin-image-card",key:photo.id},h("img",{src:publicImageUrl(photo.storage_path),alt:photo.alt_text??projectName}),h("p",null,photo.is_primary?"Cover image":"Gallery image"),photo.is_primary?null:h("form",{action:setPrimaryProjectImage},h("input",{type:"hidden",name:"project_id",value:projectId}),h("input",{type:"hidden",name:"image_id",value:photo.id}),h("button",{className:"small-button"},"Make cover"))));
 const upload=h("form",{action:uploadMoreProjectImages,className:"admin-upload-card",encType:"multipart/form-data"},h("input",{type:"hidden",name:"project_id",value:projectId}),h("input",{type:"file",name:"image",required:true,accept:"image/jpeg,image/png,image/webp,image/gif"}),h("input",{name:"alt_text",maxLength:1000}),h("button",{className:"small-button"},"Upload image"));
 return h("section",{className:"admin-panel"},h("h2",null,"Project gallery"),cards.length?h("div",{className:"admin-image-grid"},...cards):h("p",{className:"admin-empty"},"No gallery images yet."),upload);
}
