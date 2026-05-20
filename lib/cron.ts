// Shared helpers for cron routes. Vercel Cron sends a bearer token derived
// from CRON_SECRET; we verify it so the endpoints can't be triggered by
// strangers.

import { NextRequest, NextResponse } from "next/server";

export function assertCronAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // In local dev without a secret, allow anything. In prod, refuse.
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
    return null;
  }
  const header = req.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
