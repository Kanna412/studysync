import Link from "next/link";
import { LogOut } from "lucide-react";
import { MODULES } from "@/lib/modules";
import ThemeToggle from "@/components/common/ThemeToggle";
import { logout } from "@/lib/actions/auth";
export default function Layout({ children }: { children: React.ReactNode }) {
  const links = [["/dashboard", "Overview"], ...["semesters", "subjects", "syllabus_units", "syllabus_topics", "syllabus_subtopics", "tasks", "study_sessions", "assessments", "attendance_records", "exams", "mood_entries", "grading_rules"].map((k) => [`/dashboard/${k}`, MODULES[k].title]), ["/dashboard/timetable", "Timetable"], ["/dashboard/pomodoro", "Pomodoro"], ["/dashboard/gpa", "GPA & CGPA"], ["/dashboard/reports", "Reports"], ["/dashboard/analytics", "Analytics"]];
  return (
    <div className="md:flex min-h-screen">
      <nav aria-label="Main" className="md:w-56 md:shrink-0 border-b md:border-r md:border-b-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
        <div className="font-bold text-teal-700 px-2 pb-2">StudySync</div>
        <ul className="flex md:block gap-1 overflow-x-auto md:overflow-visible">
          {links.map(([h, l]) => <li key={h}><Link href={h} className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">{l}</Link></li>)}
        </ul>
        <ThemeToggle />
        <form action={logout} className="mt-2 hidden md:block"><button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500"><LogOut size={14} />Sign out</button></form>
      </nav>
      <main className="flex-1 p-4 md:p-8 min-w-0">{children}</main>
    </div>
  );
}
