import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/button-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_URL } from "@/lib/public-site";

type Props = { params: Promise<{ slug: string }> };

function projectQuery(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  return supabase.from("projects").select("id,name,slug,description,project_images(id,storage_path,alt_text,is_primary)").eq("slug", slug).eq("status", "active").maybeSingle();
}

type Project = NonNullable<QueryData<ReturnType<typeof projectQuery>>>;

async function getProject(slug: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await projectQuery(supabase, slug);
  if (error) throw error;
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const project = await getProject(slug);
    if (project) {
      const description = project.description?.trim().slice(0, 160) || `Explore ${project.name}, a project by Allex Furniture.`;
      const canonical = `/projects/${encodeURIComponent(project.slug)}`;
      return { title: project.name, description, alternates: { canonical }, openGraph: { type: "website", title: project.name, description, url: canonical } };
    }
  } catch {
    return { title: "Project", robots: { index: false, follow: true } };
  }
  return { title: "Project", robots: { index: false, follow: true } };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  let project: Project | null = null;
  try {
    project = await getProject(slug);
  } catch {
    notFound();
  }
  if (!project) notFound();

  const images = [...(project.project_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");

  return <main>
    <SiteHeader />
    <section className="page-shell project-detail-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/projects">Projects</Link><span aria-hidden="true">/</span><span aria-current="page">{project.name}</span></nav>
      <div className="project-detail-heading"><p className="eyebrow">ALLEX IN THE WORLD</p><h1>{project.name}</h1>{project.description && <p>{project.description}</p>}</div>
      {images.length && storageUrl ? <div className="project-detail-gallery">{images.map((image) => <div className="project-detail-image" key={image.id}><Image src={`${storageUrl}/storage/v1/object/public/furniture-images/${image.storage_path}`} alt={image.alt_text?.trim() || project.name} fill sizes="(max-width: 700px) 90vw, 70vw" /></div>)}</div> : <div className="empty-catalog"><p>No project images have been published yet.</p></div>}
      <ButtonLink href="/contact">Ask us about a similar project <span>↗</span></ButtonLink>
    </section>
    <SiteFooter />
  </main>;
}