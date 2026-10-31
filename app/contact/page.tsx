import type { Metadata } from "next";
import { submitContact } from "./actions";
import { Button } from "@/components/button-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Contact us" };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string; subject?: string }> }) {
  const params = await searchParams;
  return <main>
    <SiteHeader actionHref="/" actionLabel="Back to home" actionIcon="←" />
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">LET’S START SOMETHING</p>
        <h1>Good things start<br />with a <em>conversation.</em></h1>
        <p>Have a question about a piece, a room you’re planning, or a project in mind? Leave us a note and our team will get back to you.</p>
      </div>
      <form action={submitContact} className="form-card">
        <h2 style={{ fontFamily: "Georgia,serif", fontSize: 27, fontWeight: 400, marginBottom: 22 }}>Tell us a little about it.</h2>
        {params.sent && <div className="form-success">Thank you — your message has been sent. We’ll be in touch.</div>}
        {params.error && <div className="form-error">{params.error}</div>}
        <div className="form-grid">
          <div className="field"><label htmlFor="name">Your name *</label><input id="name" name="name" required maxLength={200} autoComplete="name" /></div>
          <div className="field"><label htmlFor="email">Email address *</label><input id="email" name="email" type="email" required maxLength={320} autoComplete="email" /></div>
        </div>
        <div className="form-grid">
          <div className="field"><label htmlFor="phone">Phone (optional)</label><input id="phone" name="phone" type="tel" maxLength={50} autoComplete="tel" /></div>
          <div className="field"><label htmlFor="subject">What’s it about? *</label><input id="subject" name="subject" required maxLength={300} defaultValue={params.subject ?? ""} /></div>
        </div>
        <div className="field"><label htmlFor="message">Your message *</label><textarea id="message" name="message" required maxLength={10000} /></div>
        <div className="honeypot-field" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
        <Button type="submit">Send your message <span>↗</span></Button>
        <p className="form-note">Fields marked * are required. Your message is shared with our team so we can respond.</p>
      </form>
    </section>
    <SiteFooter />
  </main>;
}
