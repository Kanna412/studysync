import { createClient } from "@/lib/supabase/server";
import { attendance } from "@/lib/calculations";
type Row = Record<string, any>;
export default async function Overview() {
  const s = await createClient();
  const [sem, subj, tasks, exams, study, units, att, ass, mood, topicsQ] = await Promise.all([
    s.from("semesters").select("*").eq("is_active", true).limit(1), s.from("subjects").select("id,semester_id"),
    s.from("tasks").select("completed,due_date"), s.from("exams").select("title,exam_at").gte("exam_at", new Date().toISOString()).order("exam_at").limit(5),
    s.from("study_sessions").select("minutes"), s.from("syllabus_units").select("status"), s.from("attendance_records").select("status"),
    s.from("assessments").select("marks,max_marks"), s.from("mood_entries").select("entry_date,mood,productivity").order("entry_date", { ascending: false }).limit(5), s.from("syllabus_topics").select("status"),
  ]);
  const active = sem.data?.[0]; const t = tasks.data ?? [];
  const hours = (study.data ?? []).reduce((a: number, r: Row) => a + r.minutes, 0) / 60;
  const src: Row[] = topicsQ.data?.length ? topicsQ.data : units.data ?? []; const done = src.filter((u) => u.status === "completed").length, nu = src.length;
  const a = attendance(att.data ?? []); const as = ass.data ?? [];
  const avg = as.length ? (as.reduce((x: number, r: Row) => x + r.marks / r.max_marks, 0) / as.length) * 100 : null;
  const today = new Date().toISOString().slice(0, 10);
  const stats: [string, string][] = [
    ["Active semester", active?.name ?? "None set"], ["Subjects", String(active ? (subj.data ?? []).filter((x: Row) => x.semester_id === active.id).length : subj.data?.length ?? 0)],
    ["Syllabus complete", nu ? `${Math.round((done / nu) * 100)}%` : "-"], ["Pending tasks", String(t.filter((x: Row) => !x.completed).length)],
    ["Overdue tasks", String(t.filter((x: Row) => !x.completed && x.due_date && x.due_date < today).length)], ["Completed tasks", String(t.filter((x: Row) => x.completed).length)],
    ["Study hours", hours.toFixed(1)], ["Academic average", avg !== null ? `${avg.toFixed(1)}%` : "-"], ["Attendance", a.pct !== null ? `${a.pct.toFixed(1)}%` : "-"],
  ];
  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">{stats.map(([l, v]) => <div key={l} className="card"><div className="text-sm text-slate-500">{l}</div><div className="text-2xl font-semibold">{v}</div></div>)}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card"><h2 className="font-semibold mb-2">Upcoming exams</h2>
          {!exams.data?.length ? <p className="text-sm text-slate-500">No upcoming exams. Add one under Exams.</p> :
            <ul className="space-y-1 text-sm">{exams.data.map((e: Row) => { const ms = new Date(e.exam_at).getTime() - Date.now(); return <li key={e.exam_at + e.title}>{e.title}: {Math.floor(ms / 864e5)}d {Math.floor((ms % 864e5) / 36e5)}h left</li>; })}</ul>}</section>
        <section className="card"><h2 className="font-semibold mb-2">Recent mood entries</h2>
          {!mood.data?.length ? <p className="text-sm text-slate-500">No entries yet. Log how today went under Mood journal.</p> :
            <ul className="space-y-1 text-sm">{mood.data.map((e: Row) => <li key={e.entry_date}>{e.entry_date}: {e.mood.replace("_", " ")}{e.productivity ? `, productivity ${e.productivity}/5` : ""}</li>)}</ul>}</section>
      </div>
    </div>
  );
}
