"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitContact(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (website) redirect("/contact?sent=1");

  if (name.length < 1 || name.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320 || subject.length < 1 || subject.length > 300 || message.length < 1 || message.length > 10000 || phone.length > 50) {
    redirect("/contact?error=Please%20check%20your%20details%20and%20try%20again");
  }

  let supabase;
  try { supabase = await createClient(); }
  catch { redirect("/contact?error=The%20contact%20form%20is%20not%20connected%20yet.%20Please%20email%20us%20directly"); }

  const { error } = await supabase.from("contacts").insert({ name, email, phone: phone || null, subject, message });
  if (error?.code === "P0001") redirect("/contact?error=Please%20wait%20before%20sending%20another%20message%20from%20this%20email");
  if (error) redirect("/contact?error=We%20could%20not%20send%20your%20message.%20Please%20try%20again");
  redirect("/contact?sent=1");
}
