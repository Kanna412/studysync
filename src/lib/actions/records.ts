"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MODULES, buildSchema } from "@/lib/modules";

async function ctx(key: string) {
  const m = MODULES[key]; if (!m) throw new Error("Unknown module");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  return { m, supabase, user };
}
export async function createRecord(key: string, fd: FormData) {
  const { m, supabase, user } = await ctx(key);
  const raw: Record<string, unknown> = {};
  for (const f of m.fields) { const v = fd.get(f.name); raw[f.name] = f.type === "boolean" ? v === "on" : v === "" || v === null ? undefined : v; }
  const p = buildSchema(m).safeParse(raw);
  if (!p.success) redirect(`/dashboard/${key}?error=${encodeURIComponent(`${p.error.issues[0].path[0]}: ${p.error.issues[0].message}`)}`);
  const d: any = { ...p.data };
  if (key === "study_sessions") {
    if (d.start_time && d.end_time && !d.minutes) { const [a, b] = [d.start_time, d.end_time].map((t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5)); d.minutes = b - a; }
    if (!(d.minutes > 0)) redirect(`/dashboard/${key}?error=${encodeURIComponent("Enter minutes, or a start time before the end time")}`);
  }
  const { error } = await supabase.from(m.table).insert({ ...d, user_id: user.id }); // ownership from session, never from client
  if (error) redirect(`/dashboard/${key}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard", "layout"); redirect(`/dashboard/${key}`);
}
export async function deleteRecord(key: string, id: string) {
  const { m, supabase } = await ctx(key);
  await supabase.from(m.table).delete().eq("id", id); revalidatePath("/dashboard", "layout");
}
export async function toggleBool(key: string, id: string, field: string, value: boolean) {
  const { m, supabase } = await ctx(key);
  if (!m.fields.some((f) => f.name === field && f.type === "boolean")) throw new Error("Invalid field");
  await supabase.from(m.table).update({ [field]: value }).eq("id", id); revalidatePath("/dashboard", "layout");
}
export async function setTarget(fd: FormData) {
  const v = Number(fd.get("target")); const { supabase, user } = await ctx("attendance_records");
  if (!(v >= 1 && v <= 99)) redirect("/dashboard/attendance_records?error=" + encodeURIComponent("Target must be 1-99"));
  await supabase.from("profiles").update({ target_attendance: v }).eq("id", user.id);
  revalidatePath("/dashboard", "layout"); redirect("/dashboard/attendance_records");
}
