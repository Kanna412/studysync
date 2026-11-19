# StudySync - Academic Command Center

Next.js 15 + TypeScript + Tailwind + Supabase (Auth, Postgres, RLS) + Recharts.

## Implemented
Auth; semesters, subjects, syllabus units, tasks, study log, assessments (custom weights), attendance, exams, mood journal, grading rules; SGPA/CGPA; overview; analytics charts; CSV export; RLS; auto + manual timetable (priority, deadline, exam-aware, revision sessions); Pomodoro that logs study time; PDF report; light/dark toggle.

## Notes
Upgrading an existing database: run `supabase/migrations/0002_study_times.sql`. Topics/subtopics, analytics filters and all 10 charts, calendar views, semester archive, study start/end times and attendance target are included. Not compiled in the authoring sandbox (no network): run `npm run build` and fix any type errors first.

## Local setup
1. `npm install`
2. Create a Supabase project. In SQL editor run `supabase/schema.sql`.
3. `cp .env.example .env.local` and fill URL + anon key (Project Settings > API).
4. In Supabase Auth > URL Configuration, add `http://localhost:3000` as Site URL.
5. `npm run dev`, open http://localhost:3000, sign up.

## GitHub
```
git init && git add . && git commit -m "Initial StudySync"
git branch -M main
git remote add origin https://github.com/YOU/studysync.git
git push -u origin main
```

## Vercel
Import the repo; framework auto-detects Next.js. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` (your Vercel URL). Add that URL to Supabase Auth redirect URLs.

## Render
New Web Service from the repo. Build: `npm install && npm run build`. Start: `npm start`. Add the same three env vars.
