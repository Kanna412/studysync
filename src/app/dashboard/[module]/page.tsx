import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MODULES } from "@/lib/modules";
import { createRecord } from "@/lib/actions/records";
import DeleteButton from "@/components/common/DeleteButton";
import DoneToggle from "@/components/common/DoneToggle";
import { setTarget } from "@/lib/actions/records";
import { attendance } from "@/lib/calculations";

type Row = Record<string, any>;
export default async function ModulePage({ params, searchParams }: { params: Promise<{ module: string }>; searchParams: Promise<{ error?: string }> }) {
  const { module: key } = await params; const { error } = await searchParams;
  const m = MODULES[key]; if (!m) notFound();
  const supabase = await createClient();
  const [{ data: rows }, { data: subjects }, { data: semesters }, { data: unitsL }, { data: topicsL }] = await Promise.all([
    supabase.from(m.table).select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("subjects").select("id,name"), supabase.from("semesters").select("id,name"), supabase.from("syllabus_units").select("id,title"), supabase.from("syllabus_topics").select("id,title"),
  ]);
  const subj = new Map((subjects ?? []).map((s: Row) => [s.id, s.name])), sem = new Map((semesters ?? []).map((s: Row) => [s.id, s.name]));
  const uMap = new Map((unitsL ?? []).map((s: Row) => [s.id, s.title])), tMap = new Map((topicsL ?? []).map((s: Row) => [s.id, s.title]));
  const { data: prof } = key === "attendance_records" ? await supabase.from("profiles").select("target_attendance").maybeSingle() : { data: null };
  const target = Number(prof?.target_attendance ?? 75);
  const show = (f: (typeof m.fields)[number], r: Row) => {
    const v = r[f.name];
    if (f.type === "boolean") return <DoneToggle module={key} id={r.id} field={f.name} value={!!v} />;
    if (v == null || v === "") return "-";
    if (f.type === "subject") return subj.get(v) ?? "-";
    if (f.type === "semester") return sem.get(v) ?? "-";
    if (f.type === "unit") return uMap.get(v) ?? "-";
    if (f.type === "topic") return tMap.get(v) ?? "-";
    if (f.type === "datetime") return new Date(v).toLocaleString();
    if (f.type === "color") return <span className="inline-block h-4 w-4 rounded-full" style={{ background: v }} />;
    return String(v);
  };
  const att = key === "attendance_records" ? (subjects ?? []).map((s: Row) => ({ name: s.name, ...attendance((rows ?? []).filter((r: Row) => r.subject_id === s.id), target) })) : [];
  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-semibold">{m.title}</h1><p className="text-sm text-slate-500">{m.hint}</p></div>
        <a className="text-sm underline" href={`/api/export/${key}`}>Export CSV</a>
      </header>
      {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">{error}</p>}
      {(key === "subjects" && !semesters?.length) || (m.fields.some((f) => f.type === "subject" && f.required) && !subjects?.length) ? (
        <p className="card text-sm">Add a {key === "subjects" ? "semester" : "subject"} first, then come back here.</p>
      ) : (
        <form action={createRecord.bind(null, key)} className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {m.fields.map((f) => (
            <label key={f.name} className={`text-sm space-y-1 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
              <span>{f.label}{f.required && " *"}</span>
              {f.type === "textarea" ? <textarea name={f.name} className="input" rows={2} /> :
               f.type === "boolean" ? <input type="checkbox" name={f.name} className="block h-5 w-5 accent-teal-700" /> :
               f.type === "select" ? <select name={f.name} className="input" required={f.required}>{f.options!.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}</select> :
               f.type === "subject" ? <select name={f.name} className="input" required={f.required}><option value="">-</option>{(subjects ?? []).map((s: Row) => <option key={s.id} value={s.id}>{s.name}</option>)}</select> :
               f.type === "unit" ? <select name={f.name} className="input" required={f.required}>{(unitsL ?? []).map((s: Row) => <option key={s.id} value={s.id}>{s.title}</option>)}</select> :
               f.type === "topic" ? <select name={f.name} className="input" required={f.required}>{(topicsL ?? []).map((s: Row) => <option key={s.id} value={s.id}>{s.title}</option>)}</select> :
               f.type === "semester" ? <select name={f.name} className="input" required={f.required}>{(semesters ?? []).map((s: Row) => <option key={s.id} value={s.id}>{s.name}</option>)}</select> :
               <input name={f.name} required={f.required} defaultValue={f.default ?? (f.type === "color" ? "#0f766e" : undefined)}
                 type={f.type === "datetime" ? "datetime-local" : f.type} min={f.min} max={f.max} step={f.step} className="input" />}
            </label>
          ))}
          <div className="sm:col-span-2 lg:col-span-3"><button className="btn">Add {m.title.toLowerCase()}</button></div>
        </form>
      )}
      {key === "attendance_records" && <form action={setTarget} className="card flex items-end gap-3"><label className="text-sm space-y-1"><span>Target attendance %</span><input name="target" type="number" min={1} max={99} defaultValue={target} className="input w-28" /></label><button className="btn">Save target</button></form>}
      {att.length > 0 && (
        <section className="card overflow-x-auto"><h2 className="font-semibold mb-2">Attendance by subject (target {target}%)</h2>
          <table className="w-full text-sm"><thead><tr className="text-left"><th>Subject</th><th>Attended / counted</th><th>%</th><th>Classes needed</th></tr></thead><tbody>
            {att.map((a) => <tr key={a.name} className="border-t border-slate-200 dark:border-slate-800"><td>{a.name}</td><td>{a.attended} / {a.total}</td>
              <td className={a.pct !== null && a.pct < target ? "text-red-600 font-medium" : ""}>{a.pct?.toFixed(1) ?? "-"}</td><td>{a.need}</td></tr>)}
          </tbody></table></section>
      )}
      <section className="card overflow-x-auto">
        {!rows?.length ? <p className="text-sm text-slate-500">Nothing here yet. Use the form above to add your first record.</p> : (
          <table className="w-full text-sm"><thead><tr className="text-left">{m.fields.filter((f) => f.type !== "textarea").map((f) => <th key={f.name} className="pr-4 pb-2">{f.label}</th>)}<th /></tr></thead>
            <tbody>{rows.map((r: Row) => (
              <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                {m.fields.filter((f) => f.type !== "textarea").map((f) => <td key={f.name} className="pr-4 py-2">{show(f, r)}</td>)}
                <td><DeleteButton module={key} id={r.id} /></td>
              </tr>))}</tbody></table>)}
      </section>
    </div>
  );
}
