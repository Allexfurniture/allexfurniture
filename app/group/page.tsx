import type { Metadata } from "next";
import Link from "next/link";
import { GROUP_CONCERNS } from "@/lib/public-site";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Our Group",
  description: "Meet the group concerns associated with ALLEX Furniture.",
  alternates: { canonical: "/group" },
};

export default function GroupPage() {
  return <main>
    <SiteHeader />
    <section className="page-shell corporate-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Our group</span></nav>
      <div className="page-heading">
        <p className="eyebrow">CONNECTED CONCERNS</p>
        <h1>Different expertise.<br /><em>Shared group.</em></h1>
        <p>ALLEX Furniture is presented alongside the group concerns listed below. Each concern retains its own identity and service information.</p>
      </div>
      <div className="group-grid">
        {GROUP_CONCERNS.map((concern, index) => <article className={`group-card${concern.current ? " group-card-current" : ""}`} key={concern.name}>
          <span className="group-number">{String(index + 1).padStart(2, "0")}</span>
          <h2>{concern.name}</h2>
          <p>{concern.description}</p>
          {concern.website ? <a className="text-link" href={concern.website} target="_blank" rel="noreferrer">{concern.current ? "Visit ALLEX Furniture" : "Visit official website"} ↗</a> : <span className="group-note">Contact ALLEX Furniture for group enquiries.</span>}
        </article>)}
      </div>
      <p className="corporate-disclaimer">Each concern has its own identity and services. Visit the linked official website where available, or contact ALLEX Furniture for group enquiries.</p>
      <div className="corporate-cta"><div><p className="eyebrow">NEED FURNITURE INFORMATION?</p><h2>We’re ready to hear about your enquiry.</h2></div><Link className="button button-dark" href="/contact">Contact us ↗</Link></div>
    </section>
    <SiteFooter />
  </main>;
}
