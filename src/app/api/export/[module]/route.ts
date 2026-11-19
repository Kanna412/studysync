import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MODULES } from "@/lib/modules";
export async function GET(_: Request, { params }: { params: Promise<{ module: string }> }) {
  const { module: key } = await params; const m = MODULES[key];
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from(m.table).select("*"); // RLS limits rows to this user
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const cols = m.fields.map((f) => f.name);
  const esc = (v: unknown) => { let x = v == null ? "" : String(v); if (/^[=+\-@]/.test(x)) x = "'" + x; return `"${x.replace(/"/g, '""')}"`; };
  const csv = [cols.join(","), ...(data ?? []).map((r: Record<string, unknown>) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${key}.csv"` } });
}
