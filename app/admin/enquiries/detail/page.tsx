import { createElement as h } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, formatAdminDate } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { updateContactStatus } from "@/app/admin/dashboard/actions";
export default async function EnquiryDetailsPage({searchParams}:{searchParams:Promise<{id?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;if(!p.id)notFound();const {supabase,user}=await requireAdmin();
 const {data:item,error}=await supabase.from("contacts").select("id,name,email,phone,subject,message,status,created_at,updated_at").eq("id",p.id).maybeSingle();if(!item)notFound();
 return h(WorkflowLayout,{title:"Enquiry details",description:"Review the complete customer submission and update its workflow status.",email:user.email,activePath:"/admin/enquiries",error:p.error||(error?"Could not load enquiry.":undefined),saved:p.saved},
 h("div",{className:"admin-detail-toolbar"},h(Link,{href:"/admin/enquiries",className:"admin-text-link"},"← All enquiries")),
 h("section",{className:"admin-panel"},h("div",{className:"admin-record-heading"},h("div",null,h("p",{className:"admin-record-kicker"},"Received "+formatAdminDate(item.created_at)),h("h2",null,item.subject||"Website enquiry")),h("span",{className:"status-pill "+item.status},item.status.replace("_"," "))),
 h("dl",{className:"admin-facts"},h("div",null,h("dt",null,"Customer"),h("dd",null,item.name)),h("div",null,h("dt",null,"Email"),h("dd",null,h("a",{href:"mailto:"+item.email},item.email))),h("div",null,h("dt",null,"Phone"),h("dd",null,item.phone?h("a",{href:"tel:"+item.phone},item.phone):"Not provided")),h("div",null,h("dt",null,"Last updated"),h("dd",null,formatAdminDate(item.updated_at)))),
 h("div",{className:"admin-detail-description"},h("h3",null,"Message"),h("p",null,item.message)),
 h("form",{action:updateContactStatus,className:"admin-form"},h("input",{type:"hidden",name:"id",value:item.id}),h("input",{type:"hidden",name:"return_to",value:"/admin/enquiries/detail?id="+item.id}),h("div",{className:"field"},h("label",{htmlFor:"enquiry-status"},"Workflow status"),h("select",{id:"enquiry-status",name:"status",defaultValue:item.status},h("option",{value:"new"},"New"),h("option",{value:"in_progress"},"In progress"),h("option",{value:"resolved"},"Resolved"),h("option",{value:"spam"},"Spam"))),h("button",{className:"small-button admin-cta",type:"submit"},"Save status"))));
}
