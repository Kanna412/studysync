"use client";
export default function ThemeToggle() {
  return <button className="px-3 py-2 text-sm text-slate-500" onClick={() => { const d = document.documentElement.classList.toggle("dark"); try { localStorage.setItem("theme", d ? "dark" : "light"); } catch {} }}>Toggle theme</button>;
}
