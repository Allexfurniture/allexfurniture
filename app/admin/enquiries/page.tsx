import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin, formatAdminDate } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { updateContactStatus } from "@/app/admin/dashboard/actions";
export default async function EnquiriesPage() {
 const {supabase,user}=await requireAdmin();
 const {data,error}=await supabase.from("contacts").select("id,subject,status,created_at").order("created_at",{ascending:false}).limit(200);
 const rows=data??[];
 return h(WorkflowLayout,{title:"Customer enquiries",description:"Review website enquiry records and track their workflow status.",email:user.email,activePath:"/admin/enquiries",error:error?.message},
 h("section",{className:"admin-panel"},h("h2",null,"Inbox"),
 rows.length?h("div",{className:"admin-table-wrap"},h("table",{className:"admin-table admin-data-table"},h("thead",null,h("tr",null,h("th",null,"Received"),h("th",null,"Subject"),h("th",null,"Status"),h("th",null,"Update"))),h("tbody",null,...rows.map(item=>h("tr",{key:item.id},h("td",null,formatAdminDate(item.created_at)),h("td",null,h(Link,{href:"/admin/enquiries/detail?id="+item.id},item.subject)),h("td",null,h("span",{className:"status-pill "+item.status},item.status.replace("_"," "))),h("td",null,h("form",{action:updateContactStatus,className:"inline-form"},h("input",{type:"hidden",name:"id",value:item.id}),h("input",{type:"hidden",name:"return_to",value:"/admin/enquiries"}),h("select",{name:"status",defaultValue:item.status},h("option",{value:"new"},"New"),h("option",{value:"in_progress"},"In progress"),h("option",{value:"resolved"},"Resolved"),h("option",{value:"spam"},"Spam")),h("button",{className:"small-button",type:"submit"},"Save")))))):h("div",{className:"admin-empty-state"},h("h3",null,"Your inbox is clear"),h("p",null,"Website contact submissions will appear here."))));
}
