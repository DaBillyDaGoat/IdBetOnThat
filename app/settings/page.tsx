import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { updateProfile, deleteAccount } from "./actions";
import { DeleteAccountForm } from "./DeleteAccountForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/settings");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="mt-8 border border-ink/10 rounded-2xl bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Profile
        </h2>
        <form action={updateProfile} className="mt-4 flex flex-col gap-4">
          <Input
            label="Email"
            value={user.email ?? ""}
            disabled
            hint="Change email is not supported yet — make a new account."
          />
          <Input
            label="Username"
            value={`@${user.username}`}
            disabled
            hint="Your URL: idbetonthat.com/u/{user.username}"
          />
          <Input
            name="displayName"
            label="Display name"
            defaultValue={user.displayName}
            required
            maxLength={50}
          />
          <Input
            name="venmoUsername"
            label="Venmo username"
            defaultValue={user.venmoUsername ?? ""}
            placeholder="your-venmo"
            hint="Required to receive payouts."
          />
          <Button type="submit" className="self-start">Save</Button>
        </form>
      </section>

      <section className="mt-8 border border-warn/30 rounded-2xl bg-warn/5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-warn">
          Danger zone
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Delete your account. Your personal info (email, Venmo handle, display name) is
          wiped. Your wager history stays in the database in anonymous form so the
          pools you participated in remain mathematically valid for other users.
        </p>
        <div className="mt-4">
          <DeleteAccountForm action={deleteAccount} />
        </div>
      </section>
    </div>
  );
}
