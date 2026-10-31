import type { Metadata } from "next";
import Link from "next/link";
import { submitContact } from "./actions";
import { Button } from "@/components/button-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { COMPANY } from "@/lib/public-site";

export const metadata: Metadata = {
  title: "Contact ALLEX Furniture",
  description: "Contact ALLEX Furniture about catalog products, office furniture, and custom furniture enquiries.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string; subject?: string }> }) {
  const params = await searchParams;
  return <main>
    <SiteHeader actionHref="/furniture" actionLabel="Browse furniture" actionIcon="↗" />
    <section className="page-shell contact-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Contact</span></nav>
      <div className="page-heading">
        <p className="eyebrow">CONTACT ALLEX FURNITURE</p>
        <h1>Tell us about your <em>enquiry.</em></h1>
        <p>Ask about a catalog product or share a furniture requirement. Include the model number when enquiring about a specific item.</p>
      </div>
      <div className="contact-information-grid">
        <article className="contact-information-card"><p className="eyebrow">HEAD OFFICE</p><h2>Visit or write to us</h2><address>{COMPANY.address}</address><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a><div className="contact-location-secondary"><p className="eyebrow">FURNITURE FACTORY</p><address>{COMPANY.factoryAddress}</address></div></article>
        <article className="contact-information-card"><p className="eyebrow">PRODUCT ENQUIRIES</p><h2>Share what you need</h2><p>Tell us the product name, model number, intended use, or the kind of furniture you are enquiring about.</p><Link className="text-link" href="/furniture">Browse published products ↗</Link></article>
      </div>
      <form action={submitContact} className="form-card">
        <h2 className="contact-form-heading">Send an enquiry</h2>
        {params.sent && <div className="form-success" role="status">Thank you — your message has been received. Our team can review your enquiry and respond.</div>}
        {params.error && <div className="form-error" role="alert">{params.error}</div>}
        <div className="form-grid">
          <div className="field"><label htmlFor="name">Your name *</label><input id="name" name="name" required maxLength={200} autoComplete="name" /></div>
          <div className="field"><label htmlFor="email">Email address *</label><input id="email" name="email" type="email" required maxLength={320} autoComplete="email" /></div>
        </div>
        <div className="form-grid">
          <div className="field"><label htmlFor="phone">Phone (optional)</label><input id="phone" name="phone" type="tel" maxLength={50} autoComplete="tel" /></div>
          <div className="field"><label htmlFor="subject">Subject *</label><input id="subject" name="subject" required maxLength={300} defaultValue={params.subject ?? ""} /></div>
        </div>
        <div className="field"><label htmlFor="message">Your message *</label><textarea id="message" name="message" required maxLength={10000} /></div>
        <div className="honeypot-field" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
        <Button type="submit">Send enquiry <span>↗</span></Button>
        <p className="form-note">Fields marked * are required. By submitting, you agree that your details may be used to respond to this enquiry. See our <Link href="/privacy-policy">Privacy Policy</Link>.</p>
      </form>
    </section>
    <SiteFooter />
  </main>;
}
