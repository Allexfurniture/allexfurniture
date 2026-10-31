import { createElement as h } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkflowLayout } from "@/components/workflow-layout";
import { createProject } from "@/app/admin/dashboard/actions";
export default async function NewProjectPage() {
 const {user}=await requireAdmin();
 return h(WorkflowLayout,{title:"Add project",description:"Create a portfolio project.",email:user.email,activePath:"/admin/projects"},
  h("section",{className:"admin-panel"},h("form",{action:createProject,className:"admin-form"},
   h("input",{type:"hidden",name:"return_to",value:"/admin/projects"}),
   h("div",{className:"field"},h("label",{htmlFor:"project-name"},"Project name *"),h("input",{id:"project-name",name:"name",required:true,maxLength:200})),
   h("div",{className:"field"},h("label",{htmlFor:"project-slug"},"Slug *"),h("input",{id:"project-slug",name:"slug",required:true,pattern:"[a-z0-9]+(-[a-z0-9]+)*"})),
   h("div",{className:"field"},h("label",{htmlFor:"project-description"},"Description"),h("textarea",{id:"project-description",name:"description",maxLength:50000})),
   h("button",{className:"small-button",type:"submit"},"Create project"))));
}
