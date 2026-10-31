import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer">
    <Link href="/" className="brand"><span className="brand-mark">A.</span><span>ALLEX<span className="brand-light">FURNITURE</span></span></Link>
    <p>Furniture for living, and living well.</p>
    <div className="footer-links"><Link href="/furniture">Furniture</Link><Link href="/projects">Projects</Link><Link href="/contact">Contact</Link><Link href="/admin/login">Admin</Link></div>
    <span className="copyright">© {new Date().getFullYear()} Allex Furniture</span>
  </footer>;
}