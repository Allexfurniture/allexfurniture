import Link from "next/link";

export function AdminSidebar({ email }: { email: string | null | undefined }) {
  return <aside className="admin-sidebar">
    <Link href="/" className="brand"><span className="brand-mark">A.</span><span>ALLEX<span className="brand-light">FURNITURE</span></span></Link>
    <p className="admin-label">WORKSPACE</p>
    <nav className="admin-nav">
      <a className="active" href="#overview">Overview</a>
      <a href="#products">Products</a>
      <a href="#product-images">Product images</a>
      <a href="#categories">Categories</a>
      <a href="#projects">Projects</a>
      <a href="#contacts">Enquiries</a>
    </nav>
    <div className="admin-sidebar-bottom">Signed in as<br/><strong>{email}</strong><br/><br/>Allex Furniture · Admin</div>
  </aside>;
}