import { createClient } from "@/lib/supabase/server";
import Pomodoro from "@/components/common/Pomodoro";
export default async function Page() {
  const { data } = await (await createClient()).from("subjects").select("id,name").order("name");
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Pomodoro</h1><Pomodoro subjects={data ?? []} /></div>;
}
