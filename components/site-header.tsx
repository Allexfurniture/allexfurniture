import Link from "next/link";

type SiteHeaderProps = {
  showNavigation?: boolean;
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: string;
};

export function SiteHeader({ showNavigation = false, actionHref = "/contact", actionLabel = "Let’s talk", actionIcon = "↗" }: SiteHeaderProps) {
  return <>
    <div className="announcement">Thoughtfully made furniture · Designed for the way you live</div>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Allex Furniture home"><span className="brand-mark">A.</span><span>ALLEX<span className="brand-light">FURNITURE</span></span></Link>
      {showNavigation && <nav className="main-nav"><a href="#collections">Collections</a><Link href="/furniture">Our furniture</Link><Link href="/projects">Projects</Link><a href="#story">Our story</a></nav>}
      <Link className="header-cta" href={actionHref}>{actionLabel} <span>{actionIcon}</span></Link>
    </header>
  </>;
}