"use client";
import { toggleBool } from "@/lib/actions/records";
export default function DoneToggle({ module, id, field, value }: { module: string; id: string; field: string; value: boolean }) {
  return <input type="checkbox" aria-label={field} checked={value} onChange={(e) => toggleBool(module, id, field, e.target.checked)} className="h-4 w-4 accent-teal-700" />;
}
