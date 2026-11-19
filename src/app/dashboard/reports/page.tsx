import { MODULES } from "@/lib/modules";
import ReportButton from "@/components/common/ReportButton";
export default function Reports() {
  return (
    <div className="space-y-6 max-w-3xl"><h1 className="text-2xl font-semibold">Reports</h1>
      <section className="card space-y-3"><h2 className="font-semibold">Academic report (PDF)</h2><p className="text-sm text-slate-500">Semesters, subjects, syllabus completion, scores, grades, attendance, study hours, GPA/CGPA and productivity, from your records.</p><ReportButton /></section>
      <section className="card"><h2 className="font-semibold mb-2">CSV exports</h2><ul className="grid grid-cols-2 gap-2 text-sm">{Object.values(MODULES).map((m) => <li key={m.key}><a className="underline" href={`/api/export/${m.key}`}>{m.title}</a></li>)}</ul></section>
    </div>
  );
}
