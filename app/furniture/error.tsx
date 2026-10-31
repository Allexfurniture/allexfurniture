"use client";

import Link from "next/link";

export default function FurnitureError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main>
      <section className="page-shell not-found-page" role="alert">
        <p className="eyebrow">CATALOG TEMPORARILY UNAVAILABLE</p>
        <h1>We couldn’t load the <em>furniture catalog.</em></h1>
        <p>Please try again. If the issue continues, contact ALLEX Furniture for assistance.</p>
        <div className="not-found-actions">
          <button className="button button-dark" type="button" onClick={reset}>Try again</button>
          <Link className="text-link" href="/contact">Contact our team</Link>
        </div>
      </section>
    </main>
  );
}
