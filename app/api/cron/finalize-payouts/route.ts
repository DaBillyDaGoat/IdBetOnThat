// Vercel Cron — finalizes payouts where ONE side has confirmed and 7+ days
// have passed without the other side responding. PRD §6.5.
// Schedule: hourly (vercel.json).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertCronAuth } from "@/lib/cron";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const unauthorized = assertCronAuth(req);
  if (unauthorized) return unauthorized;

  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

  // Find payouts where one side confirmed long ago but no finalize yet.
  const candidates = await db.payout.findMany({
    where: {
      finalizedAt: null,
      OR: [
        { paidMarkedByFromAt: { lte: cutoff } },
        { receivedMarkedByToAt: { lte: cutoff } },
      ],
    },
    select: {
      id: true,
      fromUserId: true,
      paidMarkedByFromAt: true,
    },
  });

  let finalized = 0;
  for (const p of candidates) {
    await db.$transaction(async (tx) => {
      const now = new Date();
      await tx.payout.update({
        where: { id: p.id },
        data: { finalizedAt: now },
      });
      // If the loser had marked paid, count it as paid-up for reputation.
      if (p.paidMarkedByFromAt) {
        await tx.user.update({
          where: { id: p.fromUserId },
          data: { paidUpCount: { increment: 1 } },
        });
      }
      finalized++;
    });
  }

  return NextResponse.json({
    ok: true,
    finalized,
    at: new Date().toISOString(),
  });
}
