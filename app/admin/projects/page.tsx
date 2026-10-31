import Link from "next/link";
import { requireAdmin, publicImageUrl, formatAdminDate } from "@/lib/admin-auth";
import { WorkflowLayout, SectionHeading } from "@/components/workflow-layout";
import { deleteProject, updateCatalogStatus } from "@/app/admin/dashboard/actions";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; error?: string; saved?: string }> }) {
  const p = await searchParams;
  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase.from("projects").select("id,name,slug,status,created_at,project_images(storage_path,is_primary)").order("created_at", { ascending: false }).limit(500);
  const q = (p.q ?? "").trim().toLowerCase();
  const status = p.status ?? "all";
  const rows = (data ?? []).filter(project => (!q || project.name.toLowerCase().includes(q) || project.slug.toLowerCase().includes(q)) && (status === "all" || project.status === status));

  return <WorkflowLayout title="Projects" description="Manage portfolio projects, publication status and image galleries." email={user.email} activePath="/admin/projects" error={p.error || (error ? "Could not load projects. Check your admin permissions." : undefined)} saved={p.saved}>
    <section className="admin-panel">
      <SectionHeading title="Project portfolio" description={rows.length + " matching projects"} action={<Link className="small-button admin-cta" href="/admin/projects/new">＋ Add project</Link>} />
      <div className="admin-filter-row"><form method="get" action="/admin/projects" className="admin-filter-form"><input type="search" name="q" placeholder="Search project or slug" defaultValue={p.q ?? ""} /><select name="status" defaultValue={status}><option value="all">All statuses</option><option value="active">Published</option><option value="inactive">Hidden</option></select><button className="small-button" type="submit">Filter</button><Link className="admin-secondary-button" href="/admin/projects">Reset</Link></form></div>
      {rows.length ? <div className="admin-project-grid">{rows.map(project => {
        const photos = project.project_images ?? [];
        const cover = photos.find(image => image.is_primary) || photos[0];
        const coverUrl = cover ? publicImageUrl(cover.storage_path) : null;
        return <article className="admin-project-card" key={project.id}>
          {coverUrl ? <img src={coverUrl} alt={project.name} /> : <div className="admin-project-cover-placeholder">ALLEX / PROJECT</div>}
          <div className="admin-project-card-copy"><span className={"status-pill " + project.status}>{project.status}</span><h3>{project.name}</h3><p>/{project.slug}</p><small>{formatAdminDate(project.created_at)}</small><p className="admin-message-preview">{photos.length} gallery image{photos.length === 1 ? "" : "s"}</p>
            <div className="admin-row-actions"><Link className="small-button" href={"/admin/projects/detail?id=" + project.id}>Manage gallery</Link><Link className="admin-secondary-button" href={"/admin/projects/edit?id=" + project.id}>Edit</Link>
              <form action={updateCatalogStatus} className="inline-form"><input type="hidden" name="table" value="projects" /><input type="hidden" name="id" value={project.id} /><input type="hidden" name="return_to" value="/admin/projects" /><input type="hidden" name="status" value={project.status === "active" ? "inactive" : "active"} /><button className="admin-secondary-button">{project.status === "active" ? "Hide" : "Publish"}</button></form>
              <form action={deleteProject} className="inline-form"><input type="hidden" name="id" value={project.id} /><button className="small-button button-danger">Delete</button></form>
            </div>
          </div>
        </article>;
      })}</div> : <div className="admin-empty-state"><h3>No matching projects</h3><p>Create a portfolio project, then manage its gallery from its own page.</p><Link className="small-button" href="/admin/projects/new">Create project ↗</Link></div>}
    </section>
  </WorkflowLayout>;
}
