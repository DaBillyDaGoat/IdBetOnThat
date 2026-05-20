import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { computeImpliedOdds, formatCents } from "@/lib/payouts";
import { LinkButton } from "@/components/Button";
import { CopyLink } from "./CopyLink";
import { BetForm } from "./BetForm";
import { JoinRequestButton } from "./JoinRequestButton";
import { JoinRequestList } from "./JoinRequestList";
import { CloseAndResolve } from "./CloseAndResolve";
import { DisputeButton } from "./DisputeButton";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const w = await db.wager.findUnique({
    where: { slug },
    select: { question: true },
  });
  return { title: w?.question ?? "Wager" };
}

export default async function WagerPage({ params }: { params: Params }) {
  const { slug } = await params;

  const wager = await db.wager.findUnique({
    where: { slug },
    include: {
      creator: { select: { id: true, username: true, displayName: true } },
      outcomes: { orderBy: { order: "asc" } },
      bets: {
        select: {
          id: true,
          amountCents: true,
          outcomeId: true,
          userId: true,
          createdAt: true,
          user: { select: { displayName: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      joinRequests: {
        where: { status: "PENDING" },
        include: { user: { select: { displayName: true, username: true } } },
      },
      disputes: { select: { id: true } },
    },
  });

  if (!wager) notFound();

  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const isCreator = viewerId === wager.creatorId;
  const viewerVenmo = session?.user?.venmoUsername ?? null;

  // Approval gating
  let viewerJoinStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "CREATOR" =
    "NONE";
  if (isCreator) viewerJoinStatus = "CREATOR";
  else if (viewerId && wager.accessMode === "APPROVAL_REQUIRED") {
    const jr = await db.joinRequest.findUnique({
      where: { wagerId_userId: { wagerId: wager.id, userId: viewerId } },
      select: { status: true },
    });
    viewerJoinStatus = jr?.status ?? "NONE";
  } else if (viewerId) viewerJoinStatus = "APPROVED"; // open wager

  const totalCents = wager.bets.reduce((s, b) => s + b.amountCents, 0);
  const outcomeIds = wager.outcomes.map((o) => o.id);
  const odds = computeImpliedOdds(
    wager.bets.map((b) => ({
      userId: b.userId,
      outcomeId: b.outcomeId,
      amountCents: b.amountCents,
    })),
    outcomeIds,
  );
  const outcomePools = new Map<string, number>();
  for (const b of wager.bets) {
    outcomePools.set(
      b.outcomeId,
      (outcomePools.get(b.outcomeId) ?? 0) + b.amountCents,
    );
  }

  const winningId = wager.winningOutcomeId;
  const hasDisputes = wager.disputes.length > 0;

  // Viewer is a participant if they have any bets here.
  const viewerHasBets = viewerId
    ? wager.bets.some((b) => b.userId === viewerId)
    : false;

  // 48h dispute window math.
  const inDisputeWindow =
    wager.status === "RESOLVED" &&
    wager.resolvedAt &&
    Date.now() - wager.resolvedAt.getTime() < 48 * 60 * 60 * 1000;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <StatusPill status={wager.status} />
        {hasDisputes ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-warn/10 text-warn">
            Disputed
          </span>
        ) : null}
        <span>·</span>
        <span>
          Created by{" "}
          <Link href={`/u/${wager.creator.username}`} className="hover:underline">
            {wager.creator.displayName}
          </Link>
        </span>
        {wager.closeAt ? (
          <>
            <span>·</span>
            <span>
              Closes {wager.closeAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </>
        ) : null}
      </div>

      <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
        {wager.question}
      </h1>
      {wager.description ? (
        <p className="mt-3 text-ink-muted leading-relaxed whitespace-pre-wrap">
          {wager.description}
        </p>
      ) : null}

      {/* Pool summary */}
      <div className="mt-8 flex flex-wrap gap-6 items-baseline">
        <Stat label="Pool" value={formatCents(totalCents)} />
        <Stat label="Bets" value={String(wager.bets.length)} />
        <Stat
          label="Mode"
          value={wager.mode === "PARIMUTUEL" ? "Pari-mutuel" : "Equal split"}
        />
      </div>

      {/* Outcomes */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Outcomes
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {wager.outcomes.map((o) => {
            const pool = outcomePools.get(o.id) ?? 0;
            const odd = odds.get(o.id);
            const isWinner = winningId === o.id;
            const sharePct = totalCents > 0 ? Math.round((pool / totalCents) * 100) : 0;
            return (
              <div
                key={o.id}
                className={`rounded-2xl border p-4 bg-white ${
                  isWinner ? "border-accent" : "border-ink/10"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-medium">
                    {o.label}
                    {isWinner ? (
                      <span className="ml-2 text-xs uppercase tracking-wider text-accent">
                        winner
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-ink-muted">
                    {odd?.hasBets ? (
                      <>
                        <span className="font-medium text-ink">{odd.american}</span>
                        <span className="ml-2">{odd.decimal.toFixed(2)}x</span>
                      </>
                    ) : (
                      <span>no bets yet</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-paper-soft overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${sharePct}%` }}
                    />
                  </div>
                  <div className="text-sm text-ink-muted whitespace-nowrap">
                    {formatCents(pool)} ({sharePct}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action bar — gated by wager state and viewer's relationship to it */}
      <div className="mt-10 border border-ink/10 rounded-2xl p-5 bg-paper-soft">
        <ActionPanel
          wager={wager}
          viewerId={viewerId}
          viewerVenmo={viewerVenmo}
          viewerJoinStatus={viewerJoinStatus}
          viewerHasBets={viewerHasBets}
          inDisputeWindow={!!inDisputeWindow}
          hasDisputes={hasDisputes}
        />
        <div className="mt-4 pt-4 border-t border-ink/10">
          <CopyLink slug={wager.slug} />
        </div>
      </div>

      {/* Creator-only: pending join requests */}
      {isCreator && wager.accessMode === "APPROVAL_REQUIRED" ? (
        <JoinRequestList pending={wager.joinRequests} />
      ) : null}

      {/* Recent bets */}
      {!wager.anonymousBets && wager.bets.length > 0 ? (
        <div className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Recent bets
          </h2>
          <ul className="mt-3 divide-y divide-ink/10">
            {wager.bets.slice(0, 25).map((b) => {
              const o = wager.outcomes.find((x) => x.id === b.outcomeId);
              return (
                <li key={b.id} className="py-3 flex items-center justify-between text-sm">
                  <span>
                    <Link href={`/u/${b.user.username}`} className="font-medium hover:underline">
                      {b.user.displayName}
                    </Link>{" "}
                    <span className="text-ink-muted">on</span>{" "}
                    <span>{o?.label ?? "—"}</span>
                  </span>
                  <span className="font-medium">{formatCents(b.amountCents)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-ink-muted">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    OPEN: { label: "Open for bets", bg: "bg-accent/10", fg: "text-accent-dark" },
    CLOSED: { label: "Closed", bg: "bg-ink/10", fg: "text-ink" },
    AWAITING_RESOLUTION: {
      label: "Awaiting resolution",
      bg: "bg-amber-100",
      fg: "text-amber-900",
    },
    RESOLVED: { label: "Resolved", bg: "bg-ink/10", fg: "text-ink" },
    VOID: { label: "Voided", bg: "bg-warn/10", fg: "text-warn" },
  };
  const m = map[status] ?? map.OPEN;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${m.bg} ${m.fg}`}>
      {m.label}
    </span>
  );
}

function ActionPanel(props: {
  wager: {
    slug: string;
    status: string;
    mode: "PARIMUTUEL" | "EQUAL_SPLIT";
    equalSplitCents: number | null;
    accessMode: string;
    outcomes: { id: string; label: string }[];
  };
  viewerId: string | null;
  viewerVenmo: string | null;
  viewerJoinStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "CREATOR";
  viewerHasBets: boolean;
  inDisputeWindow: boolean;
  hasDisputes: boolean;
}) {
  const {
    wager,
    viewerId,
    viewerVenmo,
    viewerJoinStatus,
    viewerHasBets,
    inDisputeWindow,
  } = props;

  // Closed/resolved/void states first.
  if (wager.status === "VOID") {
    return <div className="text-sm text-ink-muted">This wager was voided. No money owed.</div>;
  }
  if (wager.status === "RESOLVED") {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <div className="text-ink-muted">
          Wager resolved. See your dashboard for any payments you owe or are owed.
        </div>
        {inDisputeWindow && viewerHasBets ? (
          <DisputeButton slug={wager.slug} />
        ) : null}
      </div>
    );
  }
  if (wager.status === "AWAITING_RESOLUTION" || wager.status === "CLOSED") {
    if (viewerJoinStatus === "CREATOR") {
      return <CloseAndResolve wager={wager} phase="resolve" />;
    }
    return <div className="text-sm text-ink-muted">Bets are closed. Waiting for the creator to pick the winner.</div>;
  }

  // status === OPEN below
  if (!viewerId) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-ink-muted">Sign in to place a bet.</div>
        <LinkButton href={`/login?next=/${wager.slug}`} size="sm">Sign in</LinkButton>
      </div>
    );
  }

  // Approval-required and not yet approved.
  if (viewerJoinStatus === "NONE") {
    return <JoinRequestButton slug={wager.slug} />;
  }
  if (viewerJoinStatus === "PENDING") {
    return (
      <div className="text-sm text-ink-muted">
        You&rsquo;ve asked to join. The creator will approve or reject.
      </div>
    );
  }
  if (viewerJoinStatus === "REJECTED") {
    return (
      <div className="text-sm text-ink-muted">
        The creator declined your request to join this wager.
      </div>
    );
  }

  // Creator or APPROVED: show the bet form, plus creator's manual-close button.
  return (
    <div className="flex flex-col gap-4">
      <BetForm
        slug={wager.slug}
        outcomes={wager.outcomes}
        mode={wager.mode}
        equalSplitCents={wager.equalSplitCents}
        needsVenmo={!viewerVenmo}
      />
      {viewerJoinStatus === "CREATOR" ? (
        <div className="pt-4 border-t border-ink/10">
          <CloseAndResolve wager={wager} phase="close" />
        </div>
      ) : null}
    </div>
  );
}
