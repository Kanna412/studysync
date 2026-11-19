"use client";
import { useEffect, useState } from "react";
import { logStudy } from "@/lib/actions/timetable";
export default function Pomodoro({ subjects }: { subjects: { id: string; name: string }[] }) {
  const [mode, setMode] = useState<"work" | "break">("work"); const [left, setLeft] = useState(1500);
  const [run, setRun] = useState(false); const [subject, setSubject] = useState(""); const [logged, setLogged] = useState(0);
  useEffect(() => { if (!run) return; const t = setInterval(() => setLeft((l) => l - 1), 1000); return () => clearInterval(t); }, [run]);
  useEffect(() => {
    if (left !== 0) return; setRun(false);
    (async () => {
      if (mode === "work") { await logStudy(subject || null, 25); setLogged((x) => x + 25); setMode("break"); setLeft(300); }
      else { setMode("work"); setLeft(1500); }
      setRun(true);
    })();
  }, [left, mode, subject]);
  const mm = String(Math.floor(Math.max(left, 0) / 60)).padStart(2, "0"), ss = String(Math.max(left, 0) % 60).padStart(2, "0");
  return (
    <div className="card max-w-sm space-y-4 text-center">
      <p className="text-sm text-slate-500">{mode === "work" ? "Focus (25 min)" : "Break (5 min)"}</p>
      <div className="text-6xl font-semibold tabular-nums" aria-live="polite">{mm}:{ss}</div>
      <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">No subject</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <div className="flex gap-2 justify-center"><button className="btn" onClick={() => setRun(!run)}>{run ? "Pause" : "Start"}</button>
        <button className="btn !bg-slate-600" onClick={() => { setRun(false); setMode("work"); setLeft(1500); }}>Reset</button></div>
      <p className="text-xs text-slate-500">Each finished focus block is saved to your study log. Logged this visit: {logged} min.</p>
    </div>
  );
}
