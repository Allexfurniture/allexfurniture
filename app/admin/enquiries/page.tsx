import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin, formatAdminDate } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { updateContactStatus } from "@/app/admin/dashboard/actions";
export default async function EnquiriesPage() {
 const {supabase,user}=await requireAdmin();
 const {data}=await supabase.from("contacts").select("id,subject,status,created_at").order("created_at",{ascending:false}).limit(200);
 const rows=data??[];
 const items=rows.map(item=>{
  const form=h("form",{action:updateContactStatus,className:"inline-form"},h("input",{type:"hidden",name:"id",value:item.id}),h("select",{name:"status",defaultValue:item.status},h("option",{value:"new"},"New"),h("option",{value:"in_progress"},"In progress"),h("option",{value:"resolved"},"Resolved"),h("option",{value:"spam"},"Spam")),h("button",{className:"small-button"},"Save"));
  return h("article",{className:"admin-record",key:item.id},h("p",null,formatAdminDate(item.created_at)),h("h3",null,item.subject),h("span",{className:"status-pill "+item.status},item.status),form,h(Link,{href:"/admin/enquiries/detail?id="+item.id,className:"admin-text-link"},"Details"));
 });
 const empty=h("p",{className:"admin-empty"},"No enquiries yet.");
 return h(WorkflowLayout,{title:"Customer enquiries",description:"Review website enquiries and update their status.",email:user.email,activePath:"/admin/enquiries"},h("section",{className:"admin-panel"},h("h2",null,"Inbox"),rows.length?h("div",{className:"admin-record-list"},...items):empty));
}
