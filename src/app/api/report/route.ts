import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { attendance, cgpa, gradeFor, sgpa, weightedPercent, type Rule } from "@/lib/calculations";
type Row = Record<string, any>;
export async function GET() {
  const s = await createClient(); const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [prof, sems, subs, ass, att, study, units, mood, rules, tasks] = await Promise.all([
    s.from("profiles").select("full_name").maybeSingle(), s.from("semesters").select("id,name,academic_year").order("start_date"), s.from("subjects").select("id,name,code,credits,semester_id"),
    s.from("assessments").select("subject_id,marks,max_marks,weight"), s.from("attendance_records").select("subject_id,status"), s.from("study_sessions").select("minutes"),
    s.from("syllabus_units").select("subject_id,status"), s.from("mood_entries").select("mood,productivity"), s.from("grading_rules").select("grade,min_percent,grade_point"), s.from("tasks").select("completed")]);
  const R = (rules.data ?? []).map((r: Row) => ({ ...r, min_percent: +r.min_percent, grade_point: +r.grade_point })) as Rule[];
  const semesters = (sems.data ?? []).map((sm: Row) => {
    const subjects = (subs.data ?? []).filter((x: Row) => x.semester_id === sm.id).map((x: Row) => {
      const u = (units.data ?? []).filter((y: Row) => y.subject_id === x.id);
      const pct = weightedPercent((ass.data ?? []).filter((a: Row) => a.subject_id === x.id).map((a: Row) => ({ marks: +a.marks, max_marks: +a.max_marks, weight: +a.weight })));
      const g = pct === null ? null : gradeFor(pct, R);
      return { name: x.name, code: x.code, credits: +x.credits, completion: u.length ? Math.round((u.filter((y: Row) => y.status === "completed").length / u.length) * 100) : null,
        pct, grade: g?.grade ?? null, gp: g?.grade_point ?? null, attendance: attendance((att.data ?? []).filter((a: Row) => a.subject_id === x.id)).pct };
    });
    const graded = subjects.filter((x) => x.gp !== null);
    return { name: sm.name, year: sm.academic_year, subjects, sgpa: sgpa(graded.map((x) => ({ credits: x.credits, gp: x.gp! }))), credits: graded.reduce((a, x) => a + x.credits, 0) };
  });
  const m = mood.data ?? []; const t = tasks.data ?? [];
  return NextResponse.json({ name: prof.data?.full_name ?? "Student", semesters, cgpa: cgpa(semesters.filter((x) => x.sgpa !== null).map((x) => ({ sgpa: x.sgpa!, credits: x.credits }))),
    studyHours: (study.data ?? []).reduce((a: number, r: Row) => a + r.minutes, 0) / 60, tasksDone: t.filter((x: Row) => x.completed).length, tasksPending: t.filter((x: Row) => !x.completed).length,
    avgProductivity: m.filter((x: Row) => x.productivity).length ? m.reduce((a: number, x: Row) => a + (x.productivity ?? 0), 0) / m.filter((x: Row) => x.productivity).length : null, moodEntries: m.length });
}
