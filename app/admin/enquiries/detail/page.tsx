import { createElement as h } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, formatAdminDate } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
export default async function EnquiryDetailsPage({searchParams}:{searchParams:Promise<{id?:string}>}) {
 const p=await searchParams;if(!p.id)notFound();const {supabase,user}=await requireAdmin();
 const {data:item}=await supabase.from("contacts").select("id,subject,status,created_at,updated_at").eq("id",p.id).maybeSingle();if(!item)notFound();
 return h(WorkflowLayout,{title:"Enquiry details",description:"Review the submitted enquiry record.",email:user.email,activePath:"/admin/enquiries"},
 h("div",{className:"admin-detail-toolbar"},h(Link,{href:"/admin/enquiries",className:"admin-text-link"},"← All enquiries")),
 h("section",{className:"admin-panel"},h("h2",null,item.subject),h("p",null,"Received "+formatAdminDate(item.created_at)),h("p",null,"Last updated "+formatAdminDate(item.updated_at)),h("span",{className:"status-pill "+item.status},item.status)));
}
