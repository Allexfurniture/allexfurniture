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
      <div className="page-heading"><p className="eyebrow">WE RESPECT YOUR INFORMATION</p><h1>Privacy <em>policy.</em></h1><p>This page explains how information submitted through the public ALLEX Furniture website is handled.</p></div>
      <div className="legal-content">
        <h2>Information you provide</h2>
        <p>The contact form may collect your name, email address, optional phone number, subject, and message. Please do not submit passwords, payment card details, or other sensitive information through the form.</p>
        <h2>Why we use enquiry information</h2>
        <p>Information submitted through the contact form is stored as an enquiry so authorized personnel can review it and respond to your request. The information is not intended to be displayed as public catalog content.</p>
        <h2>Storage and service providers</h2>
        <p>The website uses database and hosting services to operate the catalog and receive enquiries. Those service providers may process information as needed to provide their services. Access to enquiry records is controlled by the application and its database permissions.</p>
        <h2>Retention and requests</h2>
        <p>Enquiry records may be retained for as long as reasonably needed to respond to the request, maintain business records, and meet applicable legal obligations. To ask a question about your submitted information, contact us using the details below. Requests will be handled subject to applicable law and legitimate record-keeping obligations.</p>
        <h2>Cookies, analytics, and external websites</h2>
        <p>This codebase does not add analytics or advertising trackers to the public pages. Hosting-level features or future integrations should be reviewed before publication. Links to other group concerns and third-party websites lead to services with their own privacy practices.</p>
        <h2>Children and sensitive information</h2>
        <p>The contact form is intended for business and product enquiries. Do not use it to submit sensitive personal information or information about children.</p>
        <h2>Updates to this policy</h2>
        <p>This policy may be updated if the website&apos;s data collection or processing changes. Material changes should be reflected here before the updated functionality is published.</p>
        <h2>Questions or requests</h2>
        <p>For a privacy-related question, contact <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or use the <Link href="/contact">contact page</Link>.</p>
        <p className="legal-note">Review this policy against the deployed website configuration and applicable legal requirements before production publication, especially if analytics or other third-party services are enabled.</p>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
