"use client";
import jsPDF from "jspdf";
export default function ReportButton() {
  async function go() {
    const r = await fetch("/api/report"); if (!r.ok) { alert("Could not build the report. Sign in again and retry."); return; }
    const d = await r.json(); const doc = new jsPDF(); let y = 16;
    const line = (t: string, bold = false) => { if (y > 280) { doc.addPage(); y = 16; } doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(bold ? 13 : 10); doc.text(t, 14, y); y += bold ? 8 : 6; };
    const f = (v: number | null, dp = 1, u = "") => (v === null || v === undefined ? "-" : v.toFixed(dp) + u);
    line("StudySync Academic Report", true); line(`${d.name} | generated ${new Date().toLocaleDateString()}`); y += 2;
    line("Overview", true); line(`CGPA: ${f(d.cgpa, 2)} | Study hours: ${f(d.studyHours)} | Tasks done/pending: ${d.tasksDone}/${d.tasksPending}`);
    line(`Mood entries: ${d.moodEntries} | Avg productivity: ${f(d.avgProductivity, 1, "/5")}`); y += 2;
    for (const s of d.semesters) {
      line(`${s.name}${s.year ? ` (${s.year})` : ""} - SGPA ${f(s.sgpa, 2)}`, true);
      if (!s.subjects.length) line("No subjects.");
      for (const x of s.subjects) line(`${x.name}${x.code ? ` [${x.code}]` : ""} | ${x.credits} cr | syllabus ${f(x.completion, 0, "%")} | score ${f(x.pct, 1, "%")} | grade ${x.grade ?? "-"} | attendance ${f(x.attendance, 1, "%")}`);
      y += 2;
    }
    doc.save("studysync-report.pdf");
  }
  return <button className="btn" onClick={go}>Download PDF report</button>;
}
