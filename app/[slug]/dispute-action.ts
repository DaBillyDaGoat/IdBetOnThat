"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const DISPUTE_WINDOW_MS = 48 * 60 * 60 * 1000;

export async function fileDispute(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const slug = String(formData.get("slug") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!slug) throw new Error("Bad request");
  if (reason.length < 4) throw new Error("Add a short reason");
  if (reason.length > 1000) throw new Error("Reason is too long");

  const wager = await db.wager.findUnique({
    where: { slug },
    select: { id: true, status: true, resolvedAt: true },
  });
  if (!wager) throw new Error("Wager not found");
  if (wager.status !== "RESOLVED") throw new Error("Only resolved wagers can be disputed");
  if (!wager.resolvedAt) throw new Error("Wager has no resolution timestamp");
  if (Date.now() - wager.resolvedAt.getTime() > DISPUTE_WINDOW_MS) {
    throw new Error("The 48-hour dispute window has closed");
  }

  // Caller must have participated (creator or any bettor on this wager).
  const isParticipant = await db.bet.findFirst({
    where: { wagerId: wager.id, userId },
    select: { id: true },
  });
  const isCreator = await db.wager.findFirst({
    where: { id: wager.id, creatorId: userId },
    select: { id: true },
  });
  if (!isParticipant && !isCreator) {
    throw new Error("Only participants can dispute");
  }

  // One dispute per user per wager. Make second click a no-op.
  const existing = await db.dispute.findFirst({
    where: { wagerId: wager.id, userId },
    select: { id: true },
  });
  if (existing) return;

  await db.dispute.create({
    data: { wagerId: wager.id, userId, reason },
  });

  revalidatePath(`/${slug}`);
}
