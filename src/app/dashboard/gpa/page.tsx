import { createClient } from "@/lib/supabase/server";
import { cgpa, gradeFor, sgpa, weightedPercent, type Rule } from "@/lib/calculations";
import Link from "next/link";
type Row = Record<string, any>;
export default async function Gpa() {
  const s = await createClient();
  const [sems, subs, ass, rules] = await Promise.all([s.from("semesters").select("id,name,start_date").order("start_date"), s.from("subjects").select("id,name,credits,semester_id"),
    s.from("assessments").select("subject_id,marks,max_marks,weight"), s.from("grading_rules").select("grade,min_percent,grade_point")]);
  const R = (rules.data ?? []) as Rule[];
  if (!R.length) return <div className="card max-w-xl text-sm">No grading rules yet. <Link className="underline" href="/dashboard/grading_rules">Enter your institution&apos;s grade scale</Link> first; StudySync doesn&apos;t assume one.</div>;
  const out = (sems.data ?? []).map((sm: Row) => {
    const rows = (subs.data ?? []).filter((x: Row) => x.semester_id === sm.id).map((x: Row) => {
      const pct = weightedPercent((ass.data ?? []).filter((a: Row) => a.subject_id === x.id).map((a: Row) => ({ marks: +a.marks, max_marks: +a.max_marks, weight: +a.weight })));
      const g = pct === null ? null : gradeFor(pct, R);
      return { name: x.name, credits: +x.credits, pct, g };
    });
    const graded = rows.filter((r) => r.g);
    return { name: sm.name, rows, sgpa: sgpa(graded.map((r) => ({ credits: r.credits, gp: r.g!.grade_point }))), credits: graded.reduce((a, r) => a + r.credits, 0) };
  });
  const total = cgpa(out.filter((o) => o.sgpa !== null).map((o) => ({ sgpa: o.sgpa!, credits: o.credits })));
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold">GPA &amp; CGPA</h1>
      <div className="card"><div className="text-sm text-slate-500">Cumulative GPA</div><div className="text-3xl font-semibold">{total?.toFixed(2) ?? "-"}</div></div>
      {out.map((o) => (
        <section key={o.name} className="card overflow-x-auto"><h2 className="font-semibold">{o.name}: SGPA {o.sgpa?.toFixed(2) ?? "-"}</h2>
          <table className="w-full text-sm mt-2"><thead><tr className="text-left"><th>Subject</th><th>Credits</th><th>Weighted %</th><th>Grade</th><th>Points</th></tr></thead><tbody>
            {o.rows.map((r) => <tr key={r.name} className="border-t border-slate-200 dark:border-slate-800"><td>{r.name}</td><td>{r.credits}</td><td>{r.pct?.toFixed(1) ?? "no marks"}</td><td>{r.g?.grade ?? "-"}</td><td>{r.g?.grade_point ?? "-"}</td></tr>)}
          </tbody></table></section>))}
    </div>
  );
}
