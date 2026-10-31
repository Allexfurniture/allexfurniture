import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/public-site";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BreadcrumbSchema } from "@/components/breadcrumb-schema";

export const metadata: Metadata = {
  title: "About ALLEX Furniture",
  description: "Learn about ALLEX Furniture and its furniture solutions for offices and commercial spaces.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <main>
    <SiteHeader />
    <section className="page-shell corporate-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>About</span></nav>
      <BreadcrumbSchema items={[{ name: "Home", href: "/" }, { name: "About", href: "/about" }]} />
      <div className="page-heading">
        <p className="eyebrow">ABOUT ALLEX FURNITURE</p>
        <h1>Furniture solutions for <em>working spaces.</em></h1>
        <p>ALLEX Furniture focuses on office furniture, imported furniture, and custom-made furniture solutions for business and commercial environments.</p>
      </div>
      <div className="corporate-grid">
        <article className="corporate-panel"><p className="eyebrow">WHAT WE DO</p><h2>Furniture shaped around the space.</h2><p>Explore the active catalog for current product names and model numbers. For a specific requirement, contact our team to discuss your enquiry and the information available for the product.</p><Link className="text-link" href="/furniture">Browse the furniture catalog ↗</Link></article>
        <article className="corporate-panel"><p className="eyebrow">CUSTOM ENQUIRIES</p><h2>Tell us what your project needs.</h2><p>For custom furniture or a commercial furniture enquiry, share the purpose of the space and the product you are interested in. Our team can follow up using the contact details you provide.</p><Link className="text-link" href="/contact">Contact ALLEX Furniture ↗</Link></article>
      </div>
      <section className="corporate-contact-panel">
        <p className="eyebrow">HEAD OFFICE</p>
        <h2>{COMPANY.name}</h2>
        <address>{COMPANY.address}</address>
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      </section>
    </section>
    <SiteFooter />
  </main>;
}
