
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  generatePlan,
  setPlanStatus,
} from "@/lib/actions/timetable";

type Row = Record<string, any>;

function getIndiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export default async function Timetable({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    m?: string;
    view?: string;
  }>;
}) {
  const { error, m, view } = await searchParams;
  const s = await createClient();

  // Use Indian local date consistently.
  const today = getIndiaDate();
  const weekEnd = addDays(today, 7);

  const [
    { data: plans },
    { data: subs },
  ] = await Promise.all([
    s
      .from("study_plans")
      .select("*")
      .gte("plan_date", today)
      .order("plan_date")
      .order("start_time")
      .limit(300),

    s
      .from("subjects")
      .select("id,name"),
  ]);

  const ym =
    m && /^\d{4}-\d{2}$/.test(m)
      ? m
      : today.slice(0, 7);

  const [Y, Mo] = ym.split("-").map(Number);

  const dim = new Date(Date.UTC(Y, Mo, 0)).getUTCDate();

  const lead = new Date(
    Date.UTC(Y, Mo - 1, 1)
  ).getUTCDay();

  const prev = new Date(
    Date.UTC(Y, Mo - 2, 1)
  ).toISOString().slice(0, 7);

  const next = new Date(
    Date.UTC(Y, Mo, 1)
  ).toISOString().slice(0, 7);

  const { data: mp } = await s
    .from("study_plans")
    .select("plan_date,topic,status")
    .gte("plan_date", `${ym}-01`)
    .lte(
      "plan_date",
      `${ym}-${String(dim).padStart(2, "0")}`
    );

  const name = new Map(
    (subs ?? []).map((x: Row) => [x.id, x.name])
  );

  const byDay: Record<string, Row[]> = {};

  (plans ?? [])
    .filter(
      (p: Row) =>
        view !== "week" || p.plan_date < weekEnd
    )
    .forEach((p: Row) => {
      (byDay[p.plan_date] ??= []).push(p);
    });

  const num = (
    n: string,
    l: string,
    v: number,
    min: number,
    max: number
  ) => (
    <label className="text-sm space-y-1">
      <span>{l}</span>
      <input
        name={n}
        type="number"
        defaultValue={v}
        min={min}
        max={max}
        className="input"
      />
    </label>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Timetable
          </h1>

          <p className="text-sm text-slate-500">
            Generate from pending syllabus, priorities,
            deadlines and exams, or{" "}
            <Link
              className="underline"
              href="/dashboard/study_plans"
            >
              add sessions manually
            </Link>.
          </p>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          {error}
        </p>
      )}

      <div className="flex gap-4 text-sm">
        <Link
          className="underline"
          href="/dashboard/timetable?view=week"
        >
          Next 7 days
        </Link>

        <Link
          className="underline"
          href="/dashboard/timetable"
        >
          All upcoming
        </Link>
      </div>

      <form
        action={generatePlan}
        className="card grid gap-3 sm:grid-cols-4"
      >
        {num("days", "Days to plan", 7, 1, 14)}
        {num("hoursPerDay", "Study hours / day", 3, 1, 6)}
        {num("startHour", "Start hour (24h)", 16, 5, 17)}
        {num("sessionMin", "Session minutes", 60, 30, 120)}

        <div className="sm:col-span-4 flex items-center gap-3">
          <button className="btn">
            Generate timetable
          </button>

          <span className="text-xs text-slate-500">
            Replaces your upcoming planned sessions.
            Completed and skipped ones stay.
            Revision sessions are added before exams.
          </span>
        </div>
      </form>

      {Object.keys(byDay).length === 0 ? (
        <p className="card text-sm text-slate-500">
          No upcoming sessions. Generate a timetable above.
        </p>
      ) : (
        Object.entries(byDay).map(([d, ps]) => (
          <section key={d} className="card">
            <h2 className="font-semibold mb-2">
              {new Date(
                `${d}T00:00:00.000Z`
              ).toLocaleDateString("en-IN", {
                weekday: "long",
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })}
            </h2>

            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {ps.map((p: Row) => (
                <li
                  key={p.id}
                  className="py-2 flex flex-wrap items-center gap-3 text-sm"
                >
                  <span className="w-28 tabular-nums">
                    {p.start_time.slice(0, 5)}-
                    {p.end_time.slice(0, 5)}
                  </span>

                  <span className="flex-1 min-w-40">
                    <b>
                      {name.get(p.subject_id) ?? "General"}
                    </b>
                    : {p.topic ?? "-"}
                  </span>

                  <span className="text-slate-500">
                    {p.status}
                  </span>

                  <form
                    action={setPlanStatus.bind(
                      null,
                      p.id,
                      "completed"
                    )}
                  >
                    <button className="underline">
                      Done
                    </button>
                  </form>

                  <form
                    action={setPlanStatus.bind(
                      null,
                      p.id,
                      "skipped"
                    )}
                  >
                    <button className="underline">
                      Skip
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <section className="card overflow-x-auto">
        <div className="flex justify-between mb-2">
          <Link
            className="underline text-sm"
            href={`/dashboard/timetable?m=${prev}`}
          >
            Previous
          </Link>

          <h2 className="font-semibold">{ym}</h2>

          <Link
            className="underline text-sm"
            href={`/dashboard/timetable?m=${next}`}
          >
            Next
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1 min-w-[640px] text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (d) => (
              <div key={d} className="font-medium">
                {d}
              </div>
            )
          )}

          {Array.from({ length: lead }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}

          {Array.from({ length: dim }, (_, i) => {
            const d = `${ym}-${String(i + 1).padStart(2, "0")}`;

            const ps = (mp ?? []).filter(
              (p: Row) => p.plan_date === d
            );

            return (
              <div
                key={d}
                className={`min-h-16 rounded border p-1 ${
                  d === today
                    ? "border-teal-700"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="font-medium">
                  {i + 1}
                </div>

                {ps.slice(0, 3).map(
                  (p: Row, j: number) => (
                    <div
                      key={j}
                      className={`truncate ${
                        p.status === "completed"
                          ? "line-through text-slate-400"
                          : ""
                      }`}
                    >
                      {p.topic ?? "Study"}
                    </div>
                  )
                )}

                {ps.length > 3 && (
                  <div>+{ps.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
