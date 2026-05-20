// Vercel Cron — flips OPEN wagers past their closeAt to AWAITING_RESOLUTION.
// Schedule: every 5 minutes (vercel.json).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertCronAuth } from "@/lib/cron";

export async function GET(req: NextRequest) {
  const unauthorized = assertCronAuth(req);
  if (unauthorized) return unauthorized;

  const now = new Date();
  const result = await db.wager.updateMany({
    where: {
      status: "OPEN",
      closeType: "TIMED",
      closeAt: { lte: now },
    },
    data: { status: "AWAITING_RESOLUTION", closedAt: now },
  });

  return NextResponse.json({ ok: true, closed: result.count, at: now.toISOString() });
}
