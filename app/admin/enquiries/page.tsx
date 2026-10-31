import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
export default async function EnquiriesPage() {
 const {supabase,user}=await requireAdmin();
 const {data}=await supabase.from("contacts").select("id,subject,status,created_at").order("created_at",{ascending:false}).limit(200);
 return h(WorkflowLayout,{title:"Customer enquiries",description:"Review and manage website messages.",email:user.email,activePath:"/admin/enquiries"},
 h("section",{className:"admin-panel"},h("h2",null,"Inbox"),...(data??[]).map(item=>h("article",{className:"admin-record",key:item.id},h("strong",null,item.subject),h("p",null,new Date(item.created_at).toLocaleDateString()),h("span",{className:"status-pill "+item.status},item.status),h(Link,{href:"/admin/enquiries/detail?id="+item.id,className:"small-button"},"Read message")))));
}
