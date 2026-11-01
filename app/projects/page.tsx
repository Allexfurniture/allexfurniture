import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BreadcrumbSchema } from "@/components/breadcrumb-schema";

function projectsQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("projects").select("id,name,slug,description,project_images(storage_path,alt_text,is_primary),updated_at").eq("status", "active").order("created_at", { ascending: false });
}

type Project = QueryData<ReturnType<typeof projectsQuery>>[number];

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = await createClient();
    const { data, error } = await projectsQuery(supabase);
    if (error || !data?.length) return { title: "Projects", description: "Published ALLEX Furniture projects.", alternates: { canonical: "/projects" }, robots: { index: false, follow: true } };
  } catch {
    return { title: "Projects", description: "Published ALLEX Furniture projects.", alternates: { canonical: "/projects" }, robots: { index: false, follow: true } };
  }
  return { title: "Projects", description: "Explore published projects from ALLEX Furniture.", alternates: { canonical: "/projects" } };
}

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

  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  return <main>
    <SiteHeader />
    <section className="page-shell project-listing">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Projects</span></nav>
      <BreadcrumbSchema items={[{ name: "Home", href: "/" }, { name: "Projects", href: "/projects" }]} />
      <div className="page-heading">
        <p className="eyebrow">PUBLISHED PROJECTS</p>
        <h1>Furniture in <em>real spaces.</em></h1>
        <p>Only projects published in the ALLEX Furniture catalog appear here.</p>
      </div>
      {projects.length ? <div className="project-grid">{projects.map((project) => {
        const image = project.project_images?.find((item) => item.is_primary) ?? project.project_images?.[0];
        const imageUrl = image && storageUrl ? `${storageUrl}/storage/v1/object/public/furniture-images/${image.storage_path}` : null;
        return <Link href={`/projects/${encodeURIComponent(project.slug)}`} className="project-card" key={project.id}>
          <div className="project-card-image">{imageUrl ? <Image src={imageUrl} alt={image?.alt_text?.trim() || project.name} fill sizes="(max-width: 650px) 90vw, 45vw" /> : <div className="category-placeholder" aria-hidden="true"><span>ALLEX</span><b>{project.name.slice(0, 1)}</b></div>}</div>
          <div className="project-card-copy"><h2>{project.name}</h2><p>{project.description || "Contact our team for further information about this project."}</p><span className="text-link">View project ↗</span></div>
        </Link>;
      })}</div> : <div className="empty-catalog"><span className="empty-icon" aria-hidden="true">✳</span><h2>{connected ? "No projects are published yet." : "Projects are temporarily unavailable."}</h2><p>{connected ? "There are no active project records to display at the moment." : "Please check back shortly."}</p><Link className="text-link" href="/contact">Ask about ALLEX Furniture ↗</Link></div>}
    </section>
    <SiteFooter />
  </main>;
}
