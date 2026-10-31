"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password || email.length > 320 || password.length > 1024) redirect("/admin/login?error=Enter%20your%20email%20and%20password");
  let supabase;
  try { supabase = await createClient(); } catch { redirect("/admin/login?error=Supabase%20is%20not%20configured.%20Check%20your%20environment%20variables."); }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect("/admin/login?error=Invalid%20email%20or%20password");
  if (data.user.app_metadata?.is_admin !== true) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=This%20account%20does%20not%20have%20administrator%20access");
  }
  redirect("/admin/dashboard");
}
