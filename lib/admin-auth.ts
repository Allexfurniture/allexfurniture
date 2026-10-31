import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect("/admin/login?error=Supabase%20is%20not%20configured");
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.is_admin !== true) {
    redirect("/admin/login?error=Please%20sign%20in%20as%20an%20administrator");
  }
  return { supabase, user };
}

export function publicImageUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/furniture-images/${path.split("/").map(encodeURIComponent).join("/")}` : "";
}

export function formatAdminDate(value: string) {
  return new Date(value).toLocaleString("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
