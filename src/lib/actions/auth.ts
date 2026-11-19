"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
const cred = z.object({ email: z.string().email(), password: z.string().min(8, "Password needs 8+ characters") });
const bad = (p: string, m: string) => redirect(`${p}?error=${encodeURIComponent(m)}`);
export async function login(fd: FormData) {
  const p = cred.safeParse(Object.fromEntries(fd)); if (!p.success) bad("/login", p.error.issues[0].message);
  const { error } = await (await createClient()).auth.signInWithPassword(p.data!); if (error) bad("/login", error.message);
  redirect("/dashboard");
}
export async function signup(fd: FormData) {
  const p = cred.safeParse(Object.fromEntries(fd)); if (!p.success) bad("/signup", p.error.issues[0].message);
  const name = String(fd.get("full_name") ?? "").slice(0, 100);
  const { error, data } = await (await createClient()).auth.signUp({ ...p.data!, options: { data: { full_name: name } } });
  if (error) bad("/signup", error.message);
  if (!data.session) bad("/login", "Check your email to confirm your account, then sign in.");
  redirect("/dashboard");
}
export async function logout() { await (await createClient()).auth.signOut(); redirect("/login"); }
export async function recover(fd: FormData) {
  const email = z.string().email().safeParse(fd.get("email")); if (!email.success) bad("/login", "Enter your email first");
  await (await createClient()).auth.resetPasswordForEmail(email.data!, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login` });
  bad("/login", "If that email exists, a reset link is on its way.");
}
