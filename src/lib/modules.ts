import { z } from "zod";
export type FieldType = "text" | "textarea" | "number" | "date" | "datetime" | "select" | "boolean" | "subject" | "semester" | "color" | "time" | "unit" | "topic";
export type Field = { name: string; label: string; type: FieldType; required?: boolean; options?: string[]; min?: number; max?: number; step?: number; default?: string };
export type Module = { key: string; table: string; title: string; hint: string; fields: Field[] };

const prio = ["low", "medium", "high", "urgent"], status3 = ["not_started", "in_progress", "completed"];
export const MODULES: Record<string, Module> = {
  semesters: { key: "semesters", table: "semesters", title: "Semesters", hint: "Create semesters; mark one active.", fields: [
    { name: "name", label: "Name", type: "text", required: true }, { name: "kind", label: "Odd / even", type: "select", options: ["odd", "even"], required: true },
    { name: "academic_year", label: "Academic year", type: "text" }, { name: "start_date", label: "Start", type: "date" }, { name: "end_date", label: "End", type: "date" },
    { name: "is_active", label: "Active", type: "boolean" }, { name: "archived", label: "Archived", type: "boolean" }] },
  subjects: { key: "subjects", table: "subjects", title: "Subjects", hint: "Subjects belong to a semester.", fields: [
    { name: "semester_id", label: "Semester", type: "semester", required: true }, { name: "name", label: "Name", type: "text", required: true },
    { name: "code", label: "Code", type: "text" }, { name: "faculty", label: "Faculty", type: "text" },
    { name: "credits", label: "Credits", type: "number", required: true, min: 0, step: 0.5, default: "3" }, { name: "category", label: "Category", type: "text" },
    { name: "color", label: "Colour", type: "color" }] },
  syllabus_units: { key: "syllabus_units", table: "syllabus_units", title: "Syllabus", hint: "Units per subject. Completion % rolls up on the dashboard.", fields: [
    { name: "subject_id", label: "Subject", type: "subject", required: true }, { name: "title", label: "Unit title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" }, { name: "priority", label: "Priority", type: "select", options: prio, required: true },
    { name: "status", label: "Status", type: "select", options: status3, required: true }, { name: "deadline", label: "Deadline", type: "date" }, { name: "notes", label: "Notes", type: "textarea" }] },
  syllabus_topics: { key: "syllabus_topics", table: "syllabus_topics", title: "Topics", hint: "Topics inside a unit. Overview completion uses topics once you add them.", fields: [
    { name: "unit_id", label: "Unit", type: "unit", required: true }, { name: "title", label: "Topic", type: "text", required: true },
    { name: "estimated_minutes", label: "Est. minutes", type: "number", min: 0 }, { name: "status", label: "Status", type: "select", options: status3, required: true },
    { name: "completed_on", label: "Completed on", type: "date" }, { name: "notes", label: "Notes / references", type: "textarea" }] },
  syllabus_subtopics: { key: "syllabus_subtopics", table: "syllabus_subtopics", title: "Subtopics", hint: "Finest level of the syllabus tree.", fields: [
    { name: "topic_id", label: "Topic", type: "topic", required: true }, { name: "title", label: "Subtopic", type: "text", required: true },
    { name: "status", label: "Status", type: "select", options: status3, required: true }] },
  tasks: { key: "tasks", table: "tasks", title: "Tasks", hint: "Assignments and to-dos.", fields: [
    { name: "title", label: "Title", type: "text", required: true }, { name: "subject_id", label: "Subject", type: "subject" },
    { name: "due_date", label: "Due", type: "date" }, { name: "priority", label: "Priority", type: "select", options: prio, required: true },
    { name: "category", label: "Category", type: "text" }, { name: "description", label: "Description", type: "textarea" }, { name: "completed", label: "Done", type: "boolean" }] },
  study_sessions: { key: "study_sessions", table: "study_sessions", title: "Study log", hint: "Log time spent studying.", fields: [
    { name: "subject_id", label: "Subject", type: "subject" }, { name: "topic", label: "Topic", type: "text" }, { name: "session_date", label: "Date", type: "date", required: true },
    { name: "start_time", label: "Start", type: "time" }, { name: "end_time", label: "End", type: "time" }, { name: "minutes", label: "Minutes (auto if start/end set)", type: "number", min: 1, max: 1440 }, { name: "notes", label: "Notes", type: "textarea" }] },
  assessments: { key: "assessments", table: "assessments", title: "Performance", hint: "Marks per assessment; weight is yours to set.", fields: [
    { name: "subject_id", label: "Subject", type: "subject", required: true }, { name: "name", label: "Assessment", type: "text", required: true },
    { name: "category", label: "Category", type: "select", options: ["cie", "quiz", "assignment", "lab", "see", "other"], required: true },
    { name: "marks", label: "Marks", type: "number", required: true, min: 0, step: 0.5 }, { name: "max_marks", label: "Out of", type: "number", required: true, min: 1, step: 0.5 },
    { name: "weight", label: "Weight", type: "number", min: 0, step: 0.1, default: "1" }, { name: "assessed_on", label: "Date", type: "date" }] },
  attendance_records: { key: "attendance_records", table: "attendance_records", title: "Attendance", hint: "Holidays are never counted as classes.", fields: [
    { name: "subject_id", label: "Subject", type: "subject", required: true }, { name: "class_date", label: "Date", type: "date", required: true },
    { name: "status", label: "Status", type: "select", options: ["present", "absent", "on_duty", "holiday"], required: true },
    { name: "topic", label: "Class topic", type: "text" }, { name: "notes", label: "Notes", type: "text" }] },
  exams: { key: "exams", table: "exams", title: "Exams", hint: "Upcoming exams with countdown.", fields: [
    { name: "title", label: "Exam", type: "text", required: true }, { name: "subject_id", label: "Subject", type: "subject" },
    { name: "category", label: "Category", type: "text" }, { name: "exam_at", label: "Date & time", type: "datetime", required: true }, { name: "venue", label: "Venue", type: "text" }] },
  mood_entries: { key: "mood_entries", table: "mood_entries", title: "Mood journal", hint: "Personal reflection, not a diagnosis.", fields: [
    { name: "entry_date", label: "Date", type: "date", required: true }, { name: "mood", label: "Mood", type: "select", options: ["excellent", "good", "neutral", "low", "very_low"], required: true },
    { name: "motivation", label: "Motivation 1-5", type: "number", min: 1, max: 5 }, { name: "energy", label: "Energy 1-5", type: "number", min: 1, max: 5 },
    { name: "productivity", label: "Productivity 1-5", type: "number", min: 1, max: 5 }, { name: "stress", label: "Stress 1-5", type: "number", min: 1, max: 5 },
    { name: "notes", label: "Notes", type: "textarea" }] },
  study_plans: { key: "study_plans", table: "study_plans", title: "Manual timetable", hint: "Plan a session by hand. Use Timetable to auto-generate.", fields: [
    { name: "subject_id", label: "Subject", type: "subject" }, { name: "plan_date", label: "Date", type: "date", required: true },
    { name: "start_time", label: "Start", type: "time", required: true }, { name: "end_time", label: "End", type: "time", required: true },
    { name: "topic", label: "Topic", type: "text" }, { name: "status", label: "Status", type: "select", options: ["planned", "completed", "skipped"], required: true },
    { name: "notes", label: "Notes", type: "textarea" }] },
  grading_rules: { key: "grading_rules", table: "grading_rules", title: "Grading rules", hint: "Enter your institution's scale, e.g. O / 90 / 10.", fields: [
    { name: "grade", label: "Grade", type: "text", required: true }, { name: "min_percent", label: "Min %", type: "number", required: true, min: 0, max: 100 },
    { name: "grade_point", label: "Grade point", type: "number", required: true, min: 0, step: 0.5 }] },
};

export function buildSchema(m: Module) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of m.fields) {
    let s: z.ZodTypeAny;
    if (f.type === "number") { let n = z.coerce.number(); if (f.min !== undefined) n = n.min(f.min); if (f.max !== undefined) n = n.max(f.max); s = n; }
    else if (f.type === "boolean") s = z.boolean();
    else if (f.type === "select") s = z.enum(f.options as [string, ...string[]]);
    else if (f.type === "subject" || f.type === "semester" || f.type === "unit" || f.type === "topic") s = z.string().uuid(`${f.label} is invalid`);
    else if (f.type === "datetime") s = z.string().min(1).transform((v) => new Date(v).toISOString());
    else s = z.string().trim().max(2000);
    shape[f.name] = f.required || f.type === "boolean" ? s : s.optional();
  }
  return z.object(shape);
}
