"use client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
type Row = Record<string, string | number | null>;
export function BarCard({ title, data, x, y, unit = "" }: { title: string; data: Row[]; x: string; y: string; unit?: string }) {
  return (
    <section className="card"><h2 className="font-semibold mb-3">{title}</h2>
      {data.length === 0 ? <p className="text-sm text-slate-500">No data yet. Add records to see this chart.</p> :
        <div className="h-64"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey={x} fontSize={12} /><YAxis fontSize={12} unit={unit} /><Tooltip /><Bar dataKey={y} fill="#0f766e" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}
    </section>
  );
}
export function LineCard({ title, data, x, lines }: { title: string; data: Row[]; x: string; lines: { key: string; color: string }[] }) {
  return (
    <section className="card"><h2 className="font-semibold mb-3">{title}</h2>
      {data.length === 0 ? <p className="text-sm text-slate-500">No data yet. Add records to see this chart.</p> :
        <div className="h-64"><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey={x} fontSize={12} /><YAxis fontSize={12} /><Tooltip />{lines.map((l) => <Line key={l.key} dataKey={l.key} stroke={l.color} strokeWidth={2} dot={false} />)}</LineChart></ResponsiveContainer></div>}
    </section>
  );
}
