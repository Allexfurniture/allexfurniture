import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type ButtonLinkProps = {
  href: string;
  variant?: "dark" | "light";
  className?: string;
  children: React.ReactNode;
};

export function ButtonLink({ href, variant = "dark", className = "", children }: ButtonLinkProps) {
  return <Link href={href} className={`button button-${variant}${className ? ` ${className}` : ""}`}>{children}</Link>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "light" };

export function Button({ variant = "dark", className = "", children, ...props }: ButtonProps) {
  return <button className={`button button-${variant}${className ? ` ${className}` : ""}`} {...props}>{children}</button>;
}