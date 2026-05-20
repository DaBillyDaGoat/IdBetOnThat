import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StartForm } from "./StartForm";

export const metadata = { title: "Start a wager" };

export default async function StartPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/start");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Start a wager</h1>
      <p className="mt-2 text-ink-muted">
        Set up the question and outcomes. You&rsquo;ll get a link to share.
      </p>
      <div className="mt-8">
        <StartForm />
      </div>
    </div>
  );
}
