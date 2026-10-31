import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return <main>
    <SiteHeader />
    <section className="page-shell not-found-page">
      <p className="eyebrow">404 · PAGE NOT FOUND</p>
      <h1>This page isn’t <em>in the collection.</em></h1>
      <p>The link may be outdated, or the item may no longer be published.</p>
      <div className="not-found-actions"><Link className="button button-dark" href="/furniture">Browse furniture ↗</Link><Link className="text-link" href="/">Back to home</Link></div>
    </section>
    <SiteFooter />
  </main>;
}
