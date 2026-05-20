import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { completeWelcome } from "./actions";

export const metadata = { title: "Welcome" };

type SearchParams = { next?: string };

export default async function WelcomePage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const sp = await props.searchParams;
  const next = sp.next ?? "/dashboard";

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, venmoUsername: true, ageVerified: true },
  });
  if (!user) redirect("/login");
  if (user.ageVerified) redirect(next);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="border border-ink/10 rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Quick one-time setup before you start wagering.
        </p>

        <form action={completeWelcome} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />

          <Input
            name="displayName"
            label="Display name"
            defaultValue={user.displayName}
            required
            maxLength={50}
            hint="How friends will see you. Edit anytime in Settings."
          />

          <Input
            name="venmoUsername"
            label="Venmo username (optional)"
            defaultValue={user.venmoUsername ?? ""}
            placeholder="your-venmo"
            hint="We use this to generate payment links when wagers settle. Add it later if you want."
          />

          <label className="flex gap-2 items-start text-sm">
            <input type="checkbox" name="ageOk" required className="mt-1" />
            <span>
              I&rsquo;m 18 or older.
            </span>
          </label>
          <label className="flex gap-2 items-start text-sm">
            <input type="checkbox" name="tosOk" required className="mt-1" />
            <span>
              I agree to the{" "}
              <a href="/terms" className="underline">Terms</a> and{" "}
              <a href="/privacy" className="underline">Privacy Policy</a>.
            </span>
          </label>

          <Button type="submit" size="lg">Continue</Button>
        </form>
      </div>
    </div>
  );
}
