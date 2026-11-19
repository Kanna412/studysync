import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BarCard, LineCard } from "@/components/charts/Charts";
import { attendance } from "@/lib/calculations";
type Row = Record<string, any>;
const MOOD: Record<string, number> = { excellent: 5, good: 4, neutral: 3, low: 2, very_low: 1 };
export default async function Analytics({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const f = await searchParams; const s = await createClient();
  const [sems, subsQ, assQ, studyQ, attQ, moodQ, taskQ, unitQ, topicQ] = await Promise.all([
    s.from("semesters").select("id,name").order("start_date"), s.from("subjects").select("id,name,semester_id"), s.from("assessments").select("subject_id,category,marks,max_marks,assessed_on"),
    s.from("study_sessions").select("subject_id,session_date,minutes").order("session_date"), s.from("attendance_records").select("subject_id,status,class_date"),
    s.from("mood_entries").select("entry_date,mood,motivation,energy,productivity,stress").order("entry_date"), s.from("tasks").select("subject_id,completed,due_date"),
    s.from("syllabus_units").select("id,subject_id,status"), s.from("syllabus_topics").select("unit_id,status")]);
  const all: Row[] = subsQ.data ?? []; let S = all;
  if (f.semester) S = S.filter((x) => x.semester_id === f.semester); if (f.subject) S = S.filter((x) => x.id === f.subject);
  const ids = new Set(S.map((x) => x.id)); const inR = (d?: string | null) => !d || ((!f.from || d >= f.from) && (!f.to || d <= f.to));
  const unscoped = !f.subject && !f.semester;
  const A = (assQ.data ?? []).filter((r: Row) => ids.has(r.subject_id) && (!f.category || r.category === f.category) && inR(r.assessed_on));
  const avg = (a: Row[]) => (a.length ? +((a.reduce((t, r) => t + r.marks / r.max_marks, 0) / a.length) * 100).toFixed(1) : null);
  const ST = (studyQ.data ?? []).filter((r: Row) => (r.subject_id ? ids.has(r.subject_id) : unscoped) && inR(r.session_date));
  const group = (rows: Row[], key: (r: Row) => string, val: (r: Row) => number, k: string, v: string) => {
    const o: Record<string, number> = {}; rows.forEach((r) => (o[key(r)] = (o[key(r)] ?? 0) + val(r)));
    return Object.entries(o).sort().map(([a, b]) => ({ [k]: a, [v]: +b.toFixed(2) }));
  };
  const wk = (d: string) => { const t = Date.parse(d); return new Date(t - ((new Date(t).getUTCDay() + 6) % 7) * 864e5).toISOString().slice(5, 10); };
  const perf = S.map((x) => ({ name: x.name, avg: avg(A.filter((r: Row) => r.subject_id === x.id)) })).filter((r) => r.avg !== null);
  const cats = [...new Set(A.map((r: Row) => r.category))].map((c) => ({ name: c, avg: avg(A.filter((r: Row) => r.category === c)) }));
  const semCmp = (sems.data ?? []).map((sm: Row) => { const sid = new Set(all.filter((x) => x.semester_id === sm.id).map((x) => x.id));
    return { name: sm.name, avg: avg((assQ.data ?? []).filter((r: Row) => sid.has(r.subject_id) && (!f.category || r.category === f.category) && inR(r.assessed_on))) }; }).filter((r) => r.avg !== null);
  const syl = S.map((x) => { const us = (unitQ.data ?? []).filter((u: Row) => u.subject_id === x.id), uid = new Set(us.map((u: Row) => u.id));
    const ts = (topicQ.data ?? []).filter((t: Row) => uid.has(t.unit_id)); const src = ts.length ? ts : us;
    return { name: x.name, pct: src.length ? Math.round((src.filter((t: Row) => t.status === "completed").length / src.length) * 100) : null }; }).filter((r) => r.pct !== null);
  const attD = S.map((x) => ({ name: x.name, pct: attendance((attQ.data ?? []).filter((r: Row) => r.subject_id === x.id && inR(r.class_date))).pct })).filter((r) => r.pct !== null).map((r) => ({ ...r, pct: +r.pct!.toFixed(1) }));
  const M = (moodQ.data ?? []).filter((r: Row) => inR(r.entry_date)).map((r: Row) => ({ ...r, mood_score: MOOD[r.mood] }));
  const hrs = group(ST, (r) => r.session_date, (r) => r.minutes / 60, "day", "hours");
  const joined = M.filter((r: Row) => r.productivity).map((r: Row) => ({ day: r.entry_date.slice(5), productivity: r.productivity, hours: hrs.find((h) => h.day === r.entry_date)?.hours ?? 0 }));
  const T = (taskQ.data ?? []).filter((t: Row) => (t.subject_id ? ids.has(t.subject_id) : unscoped) && inR(t.due_date));
  const td = T.length ? [{ name: "Completed", n: T.filter((x: Row) => x.completed).length }, { name: "Pending", n: T.filter((x: Row) => !x.completed).length }] : [];
  return (
    <div className="space-y-6 max-w-6xl"><h1 className="text-2xl font-semibold">Analytics</h1>
      <form className="card grid gap-3 sm:grid-cols-3 lg:grid-cols-6 items-end text-sm">
        <label className="space-y-1"><span>Semester</span><select name="semester" defaultValue={f.semester ?? ""} className="input"><option value="">All</option>{(sems.data ?? []).map((x: Row) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="space-y-1"><span>Subject</span><select name="subject" defaultValue={f.subject ?? ""} className="input"><option value="">All</option>{all.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="space-y-1"><span>Category</span><select name="category" defaultValue={f.category ?? ""} className="input"><option value="">All</option>{["cie", "quiz", "assignment", "lab", "see", "other"].map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="space-y-1"><span>From</span><input type="date" name="from" defaultValue={f.from} className="input" /></label>
        <label className="space-y-1"><span>To</span><input type="date" name="to" defaultValue={f.to} className="input" /></label>
        <div className="flex gap-3"><button className="btn">Apply</button><Link href="/dashboard/analytics" className="underline self-center">Reset</Link></div>
      </form>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarCard title="Average score by subject (%)" data={perf} x="name" y="avg" unit="%" />
        <BarCard title="Assessment comparison by category (%)" data={cats} x="name" y="avg" unit="%" />
        <BarCard title="Semester performance comparison (%)" data={semCmp} x="name" y="avg" unit="%" />
        <BarCard title="Syllabus completion (%)" data={syl} x="name" y="pct" unit="%" />
        <LineCard title="Weekly study hours (week starting)" data={group(ST, (r) => wk(r.session_date), (r) => r.minutes / 60, "week", "hours")} x="week" lines={[{ key: "hours", color: "#0f766e" }]} />
        <BarCard title="Monthly study hours" data={group(ST, (r) => r.session_date.slice(0, 7), (r) => r.minutes / 60, "month", "hours")} x="month" y="hours" />
        <BarCard title="Attendance by subject (%)" data={attD} x="name" y="pct" unit="%" />
        <BarCard title="Task completion" data={td} x="name" y="n" />
        <LineCard title="Mood and ratings" data={M} x="entry_date" lines={[{ key: "mood_score", color: "#7c3aed" }, { key: "motivation", color: "#0f766e" }, { key: "energy", color: "#d97706" }, { key: "stress", color: "#dc2626" }]} />
        <LineCard title="Productivity vs study hours" data={joined} x="day" lines={[{ key: "productivity", color: "#2563eb" }, { key: "hours", color: "#0f766e" }]} />
      </div></div>
  );
}
