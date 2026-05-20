import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LinkButton } from "@/components/Button";
import { formatCents } from "@/lib/payouts";
import { buildVenmoUrl, payoutNote } from "@/lib/venmo";
import { MarkPaidButton, ConfirmReceivedButton } from "./PayoutButtons";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/dashboard");
  const userId = session.user.id;

  const [owed, owedToMe, created, betting] = await Promise.all([
    db.payout.findMany({
      where: { fromUserId: userId, finalizedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        wager: { select: { slug: true, question: true } },
        toUser: { select: { displayName: true, username: true, venmoUsername: true } },
      },
    }),
    db.payout.findMany({
      where: { toUserId: userId, finalizedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        wager: { select: { slug: true, question: true } },
        fromUser: { select: { displayName: true, username: true } },
      },
    }),
    db.wager.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        slug: true,
        question: true,
        status: true,
        _count: { select: { bets: true } },
      },
    }),
    db.wager.findMany({
      where: {
        bets: { some: { userId } },
        creatorId: { not: userId },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        slug: true,
        question: true,
        status: true,
        _count: { select: { bets: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your dashboard</h1>
        <LinkButton href="/start" size="sm">Start a wager</LinkButton>
      </div>

      {/* ---- You owe ---- */}
      <SectionBlock
        title="You owe"
        subtitle={owed.length === 0 ? undefined : "Tap Venmo to pay, then mark it paid here."}
      >
        {owed.length === 0 ? (
          <EmptyState text="Nothing owed. Stay sharp." />
        ) : (
          <ul className="divide-y divide-ink/10">
            {owed.map((p) => {
              const venmoUrl = p.toUser.venmoUsername
                ? buildVenmoUrl({
                    recipientUsername: p.toUser.venmoUsername,
                    amountCents: p.amountCents,
                    note: payoutNote({ wagerQuestion: p.wager.question }),
                  })
                : null;
              const paidAlready = !!p.paidMarkedByFromAt;
              return (
                <li
                  key={p.id}
                  className="py-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm">
                      Pay{" "}
                      <Link href={`/u/${p.toUser.username}`} className="font-medium hover:underline">
                        {p.toUser.displayName}
                      </Link>{" "}
                      <span className="font-semibold">{formatCents(p.amountCents)}</span>
                    </div>
                    <div className="text-xs text-ink-muted mt-1">
                      For:{" "}
                      <Link href={`/${p.wager.slug}`} className="hover:underline">
                        {p.wager.question}
                      </Link>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {venmoUrl ? (
                      <a
                        href={venmoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3 inline-flex items-center justify-center rounded-lg text-sm font-medium bg-[#008CFF] text-white hover:bg-[#0072d0]"
                      >
                        Pay on Venmo
                      </a>
                    ) : (
                      <span className="text-xs text-ink-muted">
                        Recipient hasn&rsquo;t set a Venmo
                      </span>
                    )}
                    {!paidAlready ? <MarkPaidButton payoutId={p.id} /> : (
                      <span className="text-xs text-ink-muted self-center">
                        You marked paid · awaiting confirmation
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionBlock>

      {/* ---- Owed to you ---- */}
      <SectionBlock
        title="Owed to you"
        subtitle={owedToMe.length === 0 ? undefined : "Mark each as received once Venmo notifies you."}
      >
        {owedToMe.length === 0 ? (
          <EmptyState text="Nothing pending." />
        ) : (
          <ul className="divide-y divide-ink/10">
            {owedToMe.map((p) => {
              const claimed = !!p.paidMarkedByFromAt;
              const confirmed = !!p.receivedMarkedByToAt;
              return (
                <li
                  key={p.id}
                  className="py-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm">
                      <Link href={`/u/${p.fromUser.username}`} className="font-medium hover:underline">
                        {p.fromUser.displayName}
                      </Link>{" "}
                      owes you{" "}
                      <span className="font-semibold">{formatCents(p.amountCents)}</span>
                    </div>
                    <div className="text-xs text-ink-muted mt-1">
                      For:{" "}
                      <Link href={`/${p.wager.slug}`} className="hover:underline">
                        {p.wager.question}
                      </Link>
                    </div>
                    {claimed && !confirmed ? (
                      <div className="text-xs text-accent-dark mt-1">
                        They said they paid. Did you get it?
                      </div>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {!confirmed ? <ConfirmReceivedButton payoutId={p.id} /> : (
                      <span className="text-xs text-ink-muted self-center">
                        Confirmed · awaiting their mark
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionBlock>

      {/* ---- Wagers you created ---- */}
      <SectionBlock title="Wagers you created">
        {created.length === 0 ? (
          <EmptyState text="You haven't started any wagers yet." />
        ) : (
          <ul className="divide-y divide-ink/10">
            {created.map((w) => (
              <li key={w.id} className="py-3 flex items-center justify-between gap-4">
                <Link href={`/${w.slug}`} className="hover:underline truncate">
                  {w.question}
                </Link>
                <span className="text-xs text-ink-muted whitespace-nowrap">
                  {w.status} · {w._count.bets} bets
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>

      {/* ---- Wagers you bet on ---- */}
      <SectionBlock title="Wagers you've bet on">
        {betting.length === 0 ? (
          <EmptyState text="You haven't placed any bets yet." />
        ) : (
          <ul className="divide-y divide-ink/10">
            {betting.map((w) => (
              <li key={w.id} className="py-3 flex items-center justify-between gap-4">
                <Link href={`/${w.slug}`} className="hover:underline truncate">
                  {w.question}
                </Link>
                <span className="text-xs text-ink-muted whitespace-nowrap">
                  {w.status} · {w._count.bets} bets
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionBlock>
    </div>
  );
}

function SectionBlock({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-xs text-ink-muted mt-1">{subtitle}</p>
      ) : null}
      <div className="mt-3 border border-ink/10 rounded-2xl bg-white px-5 py-2">
        {children}
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-5 text-sm text-ink-muted">{text}</p>;
}
