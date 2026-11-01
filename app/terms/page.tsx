import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/public-site";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BreadcrumbSchema } from "@/components/breadcrumb-schema";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms for using the ALLEX Furniture public catalog and enquiry website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <main>
    <SiteHeader />
    <section className="page-shell legal-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Terms & conditions</span></nav>
      <BreadcrumbSchema items={[{ name: "Home", href: "/" }, { name: "Terms & conditions", href: "/terms" }]} />
      <div className="page-heading"><p className="eyebrow">WEBSITE INFORMATION</p><h1>Terms & <em>conditions.</em></h1><p>These terms describe use of the ALLEX Furniture public catalog and enquiry website.</p></div>
      <div className="legal-content">
        <h2>Catalog information</h2>
        <p>The catalog is provided to help visitors discover furniture products and their model numbers. Product names, descriptions, images, and category information reflect the data currently published on the website and may be updated or withdrawn.</p>
        <h2>No online purchase</h2>
        <p>This website is a product showcase and enquiry channel. It does not provide checkout, online payment, confirmed inventory, or a binding order process. Submitting an enquiry does not itself create a purchase contract.</p>
        <h2>Product enquiries</h2>
        <p>Visitors may use the contact form to request further information. Please provide accurate contact information and do not submit unlawful, abusive, or sensitive personal information.</p>
        <h2>External links</h2>
        <p>Links to other group concerns or third-party websites are provided for convenience. ALLEX Furniture does not control the content or policies of external sites.</p>
        <h2>Contact</h2>
        <p>For questions about these terms, email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or visit the <Link href="/contact">contact page</Link>.</p>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
