import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/public-site";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ALLEX Furniture handles information submitted through the public website.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return <main>
    <SiteHeader />
    <section className="page-shell legal-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Privacy policy</span></nav>
      <div className="page-heading"><p className="eyebrow">WE RESPECT YOUR INFORMATION</p><h1>Privacy <em>policy.</em></h1><p>This page explains the information submitted through the public ALLEX Furniture website.</p></div>
      <div className="legal-content">
        <h2>Information you provide</h2>
        <p>The contact form may collect your name, email address, optional phone number, subject, and message. Please do not submit passwords, payment card details, or other sensitive information through the form.</p>
        <h2>How we use enquiries</h2>
        <p>Information submitted through the contact form is stored as an enquiry so authorized personnel can review it and respond to your request. The website does not provide customer checkout or online payment.</p>
        <h2>Access and security</h2>
        <p>Access to enquiry records is controlled by the application and its database permissions. No online system can guarantee absolute security, so share only information needed to handle your enquiry.</p>
        <h2>Third-party websites</h2>
        <p>This website may link to external websites, including other group concerns. Those websites operate under their own privacy practices and policies.</p>
        <h2>Questions or requests</h2>
        <p>For a privacy-related question, contact <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or use the <Link href="/contact">contact page</Link>.</p>
        <p className="legal-note">This policy should be reviewed against the deployed website configuration and applicable legal requirements before production publication, especially if analytics or other third-party services are added.</p>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
