import type { Metadata } from "next";
import Link from "next/link";
import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Projects",
  description: "Explore completed interiors and furniture projects from Allex Furniture.",
  alternates: { canonical: "/projects" },
};

function projectsQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("projects").select("id,name,slug,description,project_images(storage_path,alt_text,is_primary)").eq("status", "active").order("created_at", { ascending: false });
}

type Project = QueryData<ReturnType<typeof projectsQuery>>[number];

export default async function ProjectsPage() {
  let projects: Project[] = [];
  let connected = false;
  try {
    const supabase = await createClient();
    const { data, error } = await projectsQuery(supabase);
    if (error) throw error;
    projects = data ?? [];
    connected = true;
  } catch {
    connected = false;
  }

  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return <main>
    <SiteHeader />
    <section className="page-shell project-listing">
      <Link href="/" className="text-link">← Back to home</Link>
      <div className="page-heading">
        <p className="eyebrow">ALLEX IN THE WORLD</p>
        <h1>Spaces made for <em>living.</em></h1>
        <p>Explore projects and interiors from the Allex Furniture collection.</p>
      </div>
      {projects.length ? <div className="project-grid">{projects.map((project) => {
        const image = project.project_images?.find((item) => item.is_primary) ?? project.project_images?.[0];
        const imageUrl = image && storageUrl ? `${storageUrl}/storage/v1/object/public/furniture-images/${image.storage_path}` : null;
        return <Link href={`/projects/${encodeURIComponent(project.slug)}`} className="project-card" key={project.id}>
          <div className="project-card-image">{imageUrl ? <div role="img" aria-label={image?.alt_text ?? project.name} style={{ backgroundImage: `url("${imageUrl}")` }} /> : <div className="project-card-placeholder"><span>ALLEX FURNITURE</span></div>}</div>
          <div className="project-card-copy"><h2>{project.name}</h2><p>{project.description || "A considered space by Allex Furniture."}</p><span className="text-link">View project <span>↗</span></span></div>
        </Link>;
      })}</div> : <div className="empty-catalog"><span className="empty-icon">✳</span><h2>{connected ? "Projects are taking shape." : "Projects are temporarily unavailable."}</h2><p>{connected ? "There are no published projects yet." : "Please check back shortly."}</p></div>}
    </section>
    <SiteFooter />
  </main>;
}