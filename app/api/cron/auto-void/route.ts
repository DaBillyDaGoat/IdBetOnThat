// Vercel Cron — auto-void wagers stuck in AWAITING_RESOLUTION for 30+ days
// past closeAt (or endDate, whichever later). PRD §6.7.
// Schedule: daily (vercel.json).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertCronAuth } from "@/lib/cron";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const unauthorized = assertCronAuth(req);
  if (unauthorized) return unauthorized;

  const now = new Date();

  // Fetch candidates so we can apply the max(closeAt, endDate) logic per row.
  const candidates = await db.wager.findMany({
    where: {
      status: "AWAITING_RESOLUTION",
      closedAt: { not: null },
    },
    select: {
      id: true,
      creatorId: true,
      closedAt: true,
      endDate: true,
    },
  });

  let voided = 0;
  for (const w of candidates) {
    const baseline = w.closedAt!.getTime();
    const deadline =
      w.endDate && w.endDate.getTime() > baseline
        ? w.endDate.getTime() + THIRTY_DAYS_MS
        : baseline + THIRTY_DAYS_MS;
    if (now.getTime() < deadline) continue;

    await db.$transaction(async (tx) => {
      await tx.wager.update({
        where: { id: w.id },
        data: {
          status: "VOID",
          resolvedAt: now,
          resolutionNote: "Auto-voided — creator didn't pick a winner within 30 days.",
        },
      });
      await tx.user.update({
        where: { id: w.creatorId },
        data: { wagersGhosted: { increment: 1 } },
      });
      voided++;
    });
  }

  return NextResponse.json({
    ok: true,
    voided,
    checked: candidates.length,
    at: now.toISOString(),
  });
}
