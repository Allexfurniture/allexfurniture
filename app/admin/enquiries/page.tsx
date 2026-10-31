import { createElement as h } from "react";
import Link from "next/link";
import { requireAdmin, formatAdminDate } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
import { updateContactStatus } from "@/app/admin/dashboard/actions";
export default async function EnquiriesPage({searchParams}:{searchParams:Promise<{q?:string;status?:string;error?:string;saved?:string}>}) {
 const p=await searchParams;const {supabase,user}=await requireAdmin();
 const {data,error}=await supabase.from("contacts").select("id,name,email,phone,subject,message,status,created_at").order("created_at",{ascending:false}).limit(500);
 const q=(p.q??"").trim().toLowerCase(),status=p.status??"all";
 const rows=(data??[]).filter(item=>(!q||[item.name,item.email,item.phone??"",item.subject,item.message].some(v=>v.toLowerCase().includes(q)))&&(status==="all"||item.status===status));
 return h(WorkflowLayout,{title:"Customer enquiries",description:"Review messages submitted through the public contact form and track their status.",email:user.email,activePath:"/admin/enquiries",error:p.error||(error?"Could not load enquiries. Check your admin permissions.":undefined),saved:p.saved},
  h("section",{className:"admin-panel"},h(SectionHeading,{title:"Enquiry inbox",description:rows.length+" matching enquiries"}),
   h("div",{className:"admin-filter-row"},h("form",{method:"get",action:"/admin/enquiries",className:"admin-filter-form"},h("input",{type:"search",name:"q",placeholder:"Search name, email, phone or message",defaultValue:p.q??""}),h("select",{name:"status",defaultValue:status},h("option",{value:"all"},"All statuses"),h("option",{value:"new"},"New"),h("option",{value:"in_progress"},"In progress"),h("option",{value:"resolved"},"Resolved"),h("option",{value:"spam"},"Spam")),h("button",{className:"small-button",type:"submit"},"Filter"),h(Link,{className:"admin-secondary-button",href:"/admin/enquiries"},"Reset"))),
   rows.length?h("div",{className:"admin-record-list"},...rows.map(item=>h("article",{className:"admin-record",key:item.id},
    h("div",{className:"admin-record-heading"},h("div",null,h("p",{className:"admin-record-kicker"},formatAdminDate(item.created_at)),h("h3",null,item.subject||"Website enquiry"),h("p",null,item.name+" · "+item.email),h("p",{className:"admin-message-preview"},item.message.length>180?item.message.slice(0,180)+"…":item.message)),h("span",{className:"status-pill "+item.status},item.status.replace("_"," "))),
    h("div",{className:"admin-row-actions"},h(Link,{href:"/admin/enquiries/detail?id="+item.id,className:"small-button"},"View enquiry"),
     h("form",{action:updateContactStatus,className:"inline-form"},h("input",{type:"hidden",name:"id",value:item.id}),h("select",{name:"status",defaultValue:item.status},h("option",{value:"new"},"New"),h("option",{value:"in_progress"},"In progress"),h("option",{value:"resolved"},"Resolved"),h("option",{value:"spam"},"Spam")),h("input",{type:"hidden",name:"return_to",value:"/admin/enquiries"}),h("button",{className:"admin-secondary-button",type:"submit"},"Update status"))))):h("div",{className:"admin-empty-state"},h("h3",null,"No matching enquiries"),h("p",null,"New website contact submissions will appear here."))));
}
