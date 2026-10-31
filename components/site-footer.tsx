import Link from "next/link";
import { COMPANY, GROUP_CONCERNS } from "@/lib/public-site";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand-block">
        <Link href="/" className="brand" aria-label="ALLEX Furniture home">
          <span className="brand-mark" aria-hidden="true">A.</span>
          <span>ALLEX<span className="brand-light">FURNITURE</span></span>
        </Link>
        <p>{COMPANY.tagline}</p>
        <p className="footer-address">{COMPANY.address}</p>
        <a className="footer-contact-link" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
      </div>
      <div className="footer-link-column">
        <h2>Explore</h2>
        <Link href="/about">About us</Link>
        <Link href="/furniture">Furniture catalog</Link>
        <Link href="/group">Our group</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/contact">Contact us</Link>
      </div>
      <div className="footer-link-column">
        <h2>Group concerns</h2>
        {GROUP_CONCERNS.filter((concern) => !concern.current).map((concern) =>
          concern.website
            ? <a href={concern.website} key={concern.name} target="_blank" rel="noreferrer">{concern.name}</a>
            : <Link href="/group" key={concern.name}>{concern.name}</Link>
        )}
      </div>
      <div className="footer-link-column">
        <h2>Information</h2>
        <Link href="/privacy-policy">Privacy policy</Link>
        <Link href="/terms">Terms & conditions</Link>
        <a href={COMPANY.website} target="_blank" rel="noreferrer">Official ALLEX website ↗</a>
      </div>
    </div>
    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} ALLEX Furniture. All rights reserved.</span>
      <span>Furniture enquiries only · No online checkout</span>
    </div>
  </footer>;
}
