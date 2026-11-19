
const PW: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

const iso = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;

const parseDate = (value: string) =>
  new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

const diff = (a: string, b: string) =>
  Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);

const hm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export type UnitIn = {
  title: string;
  subject_id: string;
  priority: string;
  status: string;
  deadline: string | null;
};

export type ExamIn = {
  title: string;
  subject_id: string | null;
  exam_at: string;
};

export type PlanRow = {
  subject_id: string | null;
  plan_date: string;
  start_time: string;
  end_time: string;
  topic: string;
};

type Cell = {
  subject_id: string | null;
  topic: string;
} | null;

/**
 * Generates a timetable with:
 * - Strict daily study-hour limits
 * - User-selected start time
 * - Non-overlapping sessions
 * - Priority and deadline-based unit selection
 * - Revision sessions before exams
 */
export function generate(
  units: UnitIn[],
  exams: ExamIn[],
  o: {
    from: string;
    days: number;
    startHour: number;
    hoursPerDay: number;
    sessionMin: number;
  }
): PlanRow[] {
  const sessionMin = Math.max(30, Math.min(120, o.sessionMin));
  const startHour = Math.max(5, Math.min(17, o.startHour));
  const dailyMinutes = Math.max(60, Math.min(360, o.hoursPerDay * 60));

  // Never schedule more time than the user's daily limit.
  const slots = Math.floor(dailyMinutes / sessionMin);

  if (slots < 1) return [];

  // Use date-only UTC arithmetic to avoid date shifts during calculations.
  const firstDate = parseDate(o.from);

  const dates = Array.from({ length: o.days }, (_, i) => {
    const date = new Date(firstDate);
    date.setUTCDate(date.getUTCDate() + i);
    return iso(date);
  });

  const grid: Cell[][] = dates.map(() => Array(slots).fill(null));

  // Reserve revision slots on the two days before an exam.
  for (const exam of exams) {
    for (const back of [2, 1]) {
      const examDate = parseDate(exam.exam_at);
      examDate.setUTCDate(examDate.getUTCDate() - back);

      const dayIndex = dates.indexOf(iso(examDate));

      if (dayIndex < 0) continue;

      const slotIndex = grid[dayIndex].findIndex(
        (cell) => cell === null
      );

      if (slotIndex >= 0) {
        grid[dayIndex][slotIndex] = {
          subject_id: exam.subject_id,
          topic: `Revision: ${exam.title}`,
        };
      }
    }
  }

  // Score incomplete units.
  const scored = units
    .filter((unit) => unit.status !== "completed")
    .map((unit) => {
      let score = (PW[unit.priority] ?? 2) * 10;

      if (unit.status === "in_progress") score += 5;

      if (unit.deadline) {
        const daysLeft = diff(o.from, unit.deadline);
        score += Math.max(0, 30 - daysLeft);
      }

      for (const exam of exams) {
        if (exam.subject_id !== unit.subject_id) continue;

        const daysUntilExam = diff(
          o.from,
          exam.exam_at.slice(0, 10)
        );

        if (daysUntilExam >= 0) {
          score += Math.max(0, 30 - daysUntilExam);
        }
      }

      return {
        unit,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Fill available slots in priority-weighted rounds.
  let round = 0;

  for (let dayIndex = 0; dayIndex < grid.length; dayIndex++) {
    for (let slotIndex = 0; slotIndex < slots; slotIndex++) {
      if (grid[dayIndex][slotIndex] !== null) continue;

      let selected = scored[round % Math.max(1, scored.length)];

      if (!selected) break;

      grid[dayIndex][slotIndex] = {
        subject_id: selected.unit.subject_id,
        topic: selected.unit.title,
      };

      round++;
    }
  }

  const output: PlanRow[] = [];

  grid.forEach((day, dayIndex) => {
    day.forEach((cell, slotIndex) => {
      if (!cell) return;

      const startMinutes =
        startHour * 60 + slotIndex * sessionMin;

      const endMinutes = startMinutes + sessionMin;

      // Safety check: do not create a session beyond the daily limit.
      if (slotIndex * sessionMin + sessionMin > dailyMinutes) {
        return;
      }

      output.push({
        ...cell,
        plan_date: dates[dayIndex],
        start_time: hm(startMinutes),
        end_time: hm(endMinutes),
      });
    });
  });

  return output;
}
