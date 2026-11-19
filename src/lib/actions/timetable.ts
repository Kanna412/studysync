"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generate } from "@/lib/calculations/scheduler";

async function me() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login"); return { supabase, user };
}
const opts = z.object({ days: z.coerce.number().int().min(1).max(14), hoursPerDay: z.coerce.number().min(1).max(6), startHour: z.coerce.number().int().min(5).max(17), sessionMin: z.coerce.number().int().min(30).max(120) });
export async function generatePlan(fd: FormData) {
  const { supabase, user } = await me();
  const p = opts.safeParse(Object.fromEntries(fd));
  if (!p.success) redirect(`/dashboard/timetable?error=${encodeURIComponent(p.error.issues[0].message)}`);
  const from = new Date().toISOString().slice(0, 10);
  const [{ data: units }, { data: exams }] = await Promise.all([
    supabase.from("syllabus_units").select("title,subject_id,priority,status,deadline"),
    supabase.from("exams").select("title,subject_id,exam_at").gte("exam_at", new Date().toISOString())]);
  const rows = generate(units ?? [], exams ?? [], { from, ...p.data });
  if (!rows.length) redirect("/dashboard/timetable?error=" + encodeURIComponent("Nothing to schedule. Add syllabus units that aren't completed, or exams."));
  await supabase.from("study_plans").delete().eq("status", "planned").gte("plan_date", from);
  const { error } = await supabase.from("study_plans").insert(rows.map((r) => ({ ...r, user_id: user.id })));
  if (error) redirect(`/dashboard/timetable?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/timetable"); redirect("/dashboard/timetable");
}
export async function setPlanStatus(id: string, status: "planned" | "completed" | "skipped") {
  const { supabase } = await me(); await supabase.from("study_plans").update({ status }).eq("id", id); revalidatePath("/dashboard/timetable");
}
export async function logStudy(subjectId: string | null, minutes: number) {
  const { supabase, user } = await me();
  const p = z.object({ s: z.string().uuid().nullable(), m: z.number().int().min(1).max(240) }).parse({ s: subjectId || null, m: minutes });
  await supabase.from("study_sessions").insert({ user_id: user.id, subject_id: p.s, minutes: p.m, topic: "Pomodoro" }); revalidatePath("/dashboard", "layout");
}
