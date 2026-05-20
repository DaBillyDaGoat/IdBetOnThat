import { db } from "@/lib/db";
import { formatCents } from "@/lib/payouts";
import Link from "next/link";

type Params = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const user = await db.user.findUnique({ where: { username } });
  if (!user || user.isDeleted) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">User not found</h1>
        <p className="mt-2 text-ink-muted">Or they deleted their account.</p>
      </div>
    );
  }

  const [recentWagers, disputedCreatedCount] = await Promise.all([
    db.wager.findMany({
      where: { bets: { some: { userId: user.id } } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { slug: true, question: true, status: true },
    }),
    // Disputes filed against wagers this user created
    db.wager.count({
      where: {
        creatorId: user.id,
        disputes: { some: {} },
      },
    }),
  ]);

  const winRate =
    user.winsCount + user.lossesCount > 0
      ? Math.round((user.winsCount / (user.winsCount + user.lossesCount)) * 100)
      : null;
  const paidUpRate =
    user.lossesCount > 0
      ? Math.round((user.paidUpCount / user.lossesCount) * 100)
      : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-ink/10 flex items-center justify-center text-lg font-semibold">
          {user.displayName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{user.displayName}</h1>
          <p className="text-xs text-ink-muted">
            @{user.username} · Member since{" "}
            {user.createdAt.toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Record" value={`${user.winsCount}W / ${user.lossesCount}L`} />
        <Stat label="Win rate" value={winRate === null ? "—" : `${winRate}%`} />
        <Stat label="Paid up" value={paidUpRate === null ? "—" : `${paidUpRate}%`} />
        <Stat label="Won (lifetime)" value={formatCents(user.totalWonCents)} />
      </div>

      {user.welchedCount > 0 || user.wagersGhosted > 0 || disputedCreatedCount > 0 ? (
        <div className="mt-6 rounded-2xl bg-warn/5 border border-warn/20 p-4 text-sm space-y-1">
          {user.welchedCount > 0 ? (
            <div>🚩 Welched on {user.welchedCount} bets.</div>
          ) : null}
          {user.wagersGhosted > 0 ? (
            <div>
              🚩 Ghosted {user.wagersGhosted}{" "}
              wager{user.wagersGhosted === 1 ? "" : "s"} they created.
            </div>
          ) : null}
          {disputedCreatedCount > 0 ? (
            <div>
              🚩 {disputedCreatedCount}{" "}
              wager{disputedCreatedCount === 1 ? "" : "s"} they created were disputed.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Recent activity
        </h2>
        {recentWagers.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No public activity yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/10">
            {recentWagers.map((w) => (
              <li key={w.slug} className="py-3 text-sm">
                <Link href={`/${w.slug}`} className="hover:underline">
                  {w.question}
                </Link>
                <span className="ml-2 text-xs text-ink-muted">{w.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="text-xs uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
