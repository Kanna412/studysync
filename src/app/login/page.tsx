import Link from "next/link";
import { login, recover } from "@/lib/actions/auth";
export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center p-4">
      <div className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Sign in to StudySync</h1>
        {error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">{error}</p>}
        <form action={login} className="space-y-3">
          
          <input name="email" type="email" required placeholder="Email" className="input" />
          <input name="password" type="password" required minLength={8} placeholder="Password" className="input" />
          <button className="btn w-full justify-center">Sign in</button>
        </form>
        <form action={recover} className="flex gap-2"><input name="email" type="email" placeholder="Email for reset link" className="input" /><button className="btn">Reset</button></form><Link href="/signup" className="text-sm underline">Create an account</Link>
      </div>
    </main>
  );
}
