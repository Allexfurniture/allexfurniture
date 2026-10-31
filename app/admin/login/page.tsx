import type { Metadata } from "next";
import Link from "next/link";
import { loginAdmin } from "./actions";

export const metadata: Metadata = { title: "Administrator login", robots: { index: false, follow: false, noarchive: true } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="login-wrap"><div className="login-art"><h2>A calmer way<br />to manage <em>good design.</em></h2></div><section className="login-content"><Link href="/" className="brand"><span className="brand-mark">A.</span><span>ALLEX<span className="brand-light">FURNITURE</span></span></Link><p className="eyebrow">THE BACK OFFICE</p><h1>Welcome back.</h1><p>Sign in to manage your furniture catalog and customer enquiries.</p><form className="form-card" action={loginAdmin}>{error && <div className="form-error">{error}</div>}<div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={320} /></div><div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={1024} /></div><button className="button button-dark" type="submit">Sign in securely <span>↗</span></button></form><Link className="back-home" href="/">← Return to Allex Furniture</Link></section></main>;
}
