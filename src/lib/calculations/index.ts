export type Rule = { grade: string; min_percent: number; grade_point: number };
export function gradeFor(pct: number, rules: Rule[]) {
  return [...rules].sort((a, b) => b.min_percent - a.min_percent).find((r) => pct >= r.min_percent) ?? null;
}
/** Weighted percentage of assessments: sum(weight*marks/max)/sum(weight)*100 */
export function weightedPercent(a: { marks: number; max_marks: number; weight: number }[]) {
  const w = a.reduce((s, x) => s + x.weight, 0); if (!w) return null;
  return (a.reduce((s, x) => s + (x.weight * x.marks) / x.max_marks, 0) / w) * 100;
}
/** SGPA = sum(credit*gp)/sum(credits) */
export function sgpa(items: { credits: number; gp: number }[]) {
  const c = items.reduce((s, x) => s + x.credits, 0); return c ? items.reduce((s, x) => s + x.credits * x.gp, 0) / c : null;
}
/** CGPA = sum(sgpa*credits)/sum(credits) */
export function cgpa(sems: { sgpa: number; credits: number }[]) {
  const c = sems.reduce((s, x) => s + x.credits, 0); return c ? sems.reduce((s, x) => s + x.sgpa * x.credits, 0) / c : null;
}
/** Holidays are excluded. On duty counts as attended. */
export function attendance(recs: { status: string }[], target = 75) {
  const attended = recs.filter((r) => r.status === "present" || r.status === "on_duty").length;
  const total = recs.filter((r) => r.status !== "holiday").length;
  const pct = total ? (attended / total) * 100 : null;
  const need = pct !== null && pct < target && target < 100 ? Math.ceil((target * total - 100 * attended) / (100 - target)) : 0;
  return { attended, total, pct, need };
}
