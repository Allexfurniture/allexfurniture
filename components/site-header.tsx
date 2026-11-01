import Link from "next/link";

type SiteHeaderProps = {
  showNavigation?: boolean;
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: string;
};

const navigation = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/furniture", label: "Furniture" },
  { href: "/group", label: "Our Group" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  showNavigation = true,
  actionHref = "/contact",
  actionLabel = "Enquire",
  actionIcon = "↗",
}: SiteHeaderProps) {
  return <>
    <div className="announcement">{ "Commercial furniture · Custom-made solutions · Product enquiries" }</div>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="ALLEX Furniture home">
        <span className="brand-mark" aria-hidden="true">A.</span>
        <span>ALLEX<span className="brand-light">FURNITURE</span></span>
      </Link>
      {showNavigation && <nav className="main-nav" aria-label="Primary navigation">
        {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
      </nav>}
      <Link className="header-cta" href={actionHref}>{actionLabel} <span>{actionIcon}</span></Link>
      {showNavigation && <details className="mobile-menu">
        <summary aria-label="Open navigation menu">Menu <span aria-hidden="true">☰</span></summary>
        <nav className="mobile-menu-panel" aria-label="Mobile navigation">
          {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
      </details>}
    </header>
  </>;
}
