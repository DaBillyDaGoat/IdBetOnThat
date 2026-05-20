// Vercel Cron — flags loser as a welcher when a payout is still unfinalized
// 14+ days after the wager resolved. PRD §6.5 final step.
// Schedule: daily (vercel.json).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertCronAuth } from "@/lib/cron";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const unauthorized = assertCronAuth(req);
  if (unauthorized) return unauthorized;

  const cutoff = new Date(Date.now() - FOURTEEN_DAYS_MS);

  // Payouts past 14d cutoff, still not finalized, not yet flagged.
  const candidates = await db.payout.findMany({
    where: {
      finalizedAt: null,
      welchFlaggedAt: null,
      wager: { resolvedAt: { lte: cutoff } },
    },
    select: { id: true, fromUserId: true },
  });

  let flagged = 0;
  for (const p of candidates) {
    await db.$transaction(async (tx) => {
      const now = new Date();
      await tx.payout.update({
        where: { id: p.id },
        data: { welchFlaggedAt: now },
      });
      await tx.user.update({
        where: { id: p.fromUserId },
        data: { welchedCount: { increment: 1 } },
      });
      flagged++;
    });
  }

  return NextResponse.json({
    ok: true,
    flagged,
    at: new Date().toISOString(),
  });
}
