// Resolution engine: turns a closed wager into Payout rows + counter updates.
// Lives in lib/ so it can be imported by both the server action and the
// integration tests.

import type { PrismaClient } from "@prisma/client";
import { resolvePariMutuel } from "./payouts";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export type ResolveSummary = {
  status: "RESOLVED" | "VOID";
  /** Net cents per user (positive = won, negative = lost). Empty for VOID. */
  userNets: Record<string, number>;
  /** Payout transactions created. */
  payouts: { fromUserId: string; toUserId: string; amountCents: number }[];
};

/**
 * Resolve a wager to a specific winning outcome. Must run inside a Prisma
 * transaction so payouts + status flip + counter updates are atomic.
 *
 * Throws if:
 *  - wager not found
 *  - wager not in CLOSED or AWAITING_RESOLUTION status
 *  - winningOutcomeId not part of this wager
 *
 * If nobody bet on the winning outcome, the wager is auto-voided (no payouts,
 * no money has changed hands anyway — bets are commitments, not custody).
 */
export async function resolveWagerInTx(
  tx: Tx,
  args: { wagerId: string; winningOutcomeId: string },
): Promise<ResolveSummary> {
  const wager = await tx.wager.findUnique({
    where: { id: args.wagerId },
    include: {
      outcomes: { select: { id: true } },
      bets: { select: { userId: true, outcomeId: true, amountCents: true } },
    },
  });
  if (!wager) throw new Error("Wager not found");
  if (wager.status !== "CLOSED" && wager.status !== "AWAITING_RESOLUTION") {
    throw new Error(`Cannot resolve a wager in status ${wager.status}`);
  }
  if (!wager.outcomes.some((o) => o.id === args.winningOutcomeId)) {
    throw new Error("That outcome doesn't belong to this wager");
  }

  const result = resolvePariMutuel(wager.bets, args.winningOutcomeId);

  if (result.kind === "no_winners") {
    // Nobody picked the winning outcome. Per PRD, no money moves; we void.
    await tx.wager.update({
      where: { id: wager.id },
      data: {
        status: "VOID",
        resolutionNote: "No bettors picked the winning outcome; auto-voided.",
        resolvedAt: new Date(),
      },
    });
    return { status: "VOID", userNets: {}, payouts: [] };
  }

  // 1. Update wager status + winning outcome.
  await tx.wager.update({
    where: { id: wager.id },
    data: {
      status: "RESOLVED",
      winningOutcomeId: args.winningOutcomeId,
      resolvedAt: new Date(),
    },
  });

  // 2. Create Payout rows.
  if (result.payouts.length > 0) {
    await tx.payout.createMany({
      data: result.payouts.map((p) => ({
        wagerId: wager.id,
        fromUserId: p.fromUserId,
        toUserId: p.toUserId,
        amountCents: p.amountCents,
      })),
    });
  }

  // 3. Update per-user reputation counters.
  // Win/loss = "did you have any stake on the winning outcome?", regardless of
  // net cash. A user who hedged both ways still counts as a winner if they
  // picked the right side at all. Total $ won/lost uses the actual cash net.
  const winnerUserIds = new Set(
    wager.bets
      .filter((b) => b.outcomeId === args.winningOutcomeId)
      .map((b) => b.userId),
  );
  const allParticipantIds = new Set(wager.bets.map((b) => b.userId));

  // Run counter updates in parallel — these are independent rows.
  await Promise.all(
    [...allParticipantIds].map(async (uid) => {
      const isWinner = winnerUserIds.has(uid);
      const net = result.userNets.get(uid) ?? 0;
      await tx.user.update({
        where: { id: uid },
        data: {
          winsCount: { increment: isWinner ? 1 : 0 },
          lossesCount: { increment: isWinner ? 0 : 1 },
          totalWonCents: { increment: net > 0 ? net : 0 },
          totalLostCents: { increment: net < 0 ? -net : 0 },
        },
      });
    }),
  );

  const userNetsObj: Record<string, number> = {};
  for (const [k, v] of result.userNets) userNetsObj[k] = v;

  return {
    status: "RESOLVED",
    userNets: userNetsObj,
    payouts: result.payouts,
  };
}
