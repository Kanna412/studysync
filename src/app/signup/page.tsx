import Link from "next/link";
import { signup, recover } from "@/lib/actions/auth";
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center p-4">
      <div className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Create account to StudySync</h1>
        {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">{error}</p>}
        <form action={signup} className="space-y-3">
          <input name="full_name" placeholder="Full name" className="input" />
          <input name="email" type="email" required placeholder="Email" className="input" />
          <input name="password" type="password" required minLength={8} placeholder="Password" className="input" />
          <button className="btn w-full justify-center">Create account</button>
        </form>
        <Link href="/login" className="text-sm underline">Already registered? Sign in</Link>
      </div>
    </main>
  );
}
