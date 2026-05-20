"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// ---------- placeBet ----------

const PlaceBetInput = z.object({
  slug: z.string().min(1),
  outcomeId: z.string().min(1),
  // Accept amount in dollars from the form, validate ≥ 1.
  amountDollars: z.number().finite().min(1, "Minimum bet is $1.00").max(100_000),
  venmoUsername: z.string().trim().max(60).optional(),
});

export async function placeBet(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const raw = {
    slug: String(formData.get("slug") ?? ""),
    outcomeId: String(formData.get("outcomeId") ?? ""),
    amountDollars: Number(formData.get("amount") ?? NaN),
    venmoUsername: (formData.get("venmoUsername") as string) || undefined,
  };
  const parsed = PlaceBetInput.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const input = parsed.data;
  const amountCents = Math.round(input.amountDollars * 100);

  await db.$transaction(async (tx) => {
    const wager = await tx.wager.findUnique({
      where: { slug: input.slug },
      include: { outcomes: { select: { id: true } } },
    });
    if (!wager) throw new Error("Wager not found");
    if (wager.status !== "OPEN") {
      throw new Error("That wager is closed for new bets");
    }
    if (wager.closeAt && wager.closeAt.getTime() <= Date.now()) {
      throw new Error("That wager is closed for new bets");
    }
    if (!wager.outcomes.find((o) => o.id === input.outcomeId)) {
      throw new Error("Unknown outcome");
    }

    // Approval check: creator is implicitly approved.
    if (wager.accessMode === "APPROVAL_REQUIRED" && wager.creatorId !== userId) {
      const jr = await tx.joinRequest.findUnique({
        where: { wagerId_userId: { wagerId: wager.id, userId } },
      });
      if (!jr || jr.status !== "APPROVED") {
        throw new Error("You need approval from the creator before you can bet");
      }
    }

    // Equal-split mode: amount must match the fixed buy-in exactly.
    if (wager.mode === "EQUAL_SPLIT") {
      if (!wager.equalSplitCents) throw new Error("Wager misconfigured");
      if (amountCents !== wager.equalSplitCents) {
        throw new Error(
          `This is an equal-split wager — bet must be exactly $${(wager.equalSplitCents / 100).toFixed(2)}`,
        );
      }
      // Limit one bet per user in equal-split mode.
      const existing = await tx.bet.findFirst({
        where: { wagerId: wager.id, userId },
        select: { id: true },
      });
      if (existing) {
        throw new Error("You've already bet on this equal-split wager");
      }
    }

    // Venmo capture: required on first bet sitewide.
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { venmoUsername: true },
    });
    if (!user) throw new Error("User missing");
    if (!user.venmoUsername) {
      const v = (input.venmoUsername ?? "").replace(/^@/, "").trim();
      if (!v) throw new Error("Add your Venmo username before placing a bet");
      await tx.user.update({
        where: { id: userId },
        data: { venmoUsername: v },
      });
    }

    // Compute implied odds at placement (post-bet) for history. Decimal odds.
    const existingBets = await tx.bet.findMany({
      where: { wagerId: wager.id },
      select: { outcomeId: true, amountCents: true },
    });
    const outcomePool =
      existingBets
        .filter((b) => b.outcomeId === input.outcomeId)
        .reduce((s, b) => s + b.amountCents, 0) + amountCents;
    const totalPool =
      existingBets.reduce((s, b) => s + b.amountCents, 0) + amountCents;
    const impliedOdds = outcomePool > 0 ? totalPool / outcomePool : 1;

    await tx.bet.create({
      data: {
        wagerId: wager.id,
        userId,
        outcomeId: input.outcomeId,
        amountCents,
        impliedOddsAtPlacement: impliedOdds,
      },
    });
  });

  revalidatePath(`/${input.slug}`);
}

// ---------- requestToJoin ----------

export async function requestToJoin(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const slug = String(formData.get("slug") ?? "");
  if (!slug) throw new Error("Bad request");

  const wager = await db.wager.findUnique({
    where: { slug },
    select: { id: true, creatorId: true, accessMode: true, status: true },
  });
  if (!wager) throw new Error("Wager not found");
  if (wager.creatorId === userId) return; // creators auto-approved
  if (wager.accessMode !== "APPROVAL_REQUIRED") return; // nothing to request

  await db.joinRequest.upsert({
    where: { wagerId_userId: { wagerId: wager.id, userId } },
    create: { wagerId: wager.id, userId, status: "PENDING" },
    update: {}, // no-op on re-click
  });

  revalidatePath(`/${slug}`);
}

// ---------- decideJoinRequest (creator only) ----------

export async function decideJoinRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const joinRequestId = String(formData.get("joinRequestId") ?? "");
  const decision =
    String(formData.get("decision") ?? "") === "APPROVE" ? "APPROVED" : "REJECTED";

  const jr = await db.joinRequest.findUnique({
    where: { id: joinRequestId },
    include: { wager: { select: { creatorId: true, slug: true } } },
  });
  if (!jr) throw new Error("Join request not found");
  if (jr.wager.creatorId !== userId) throw new Error("Not authorized");

  await db.joinRequest.update({
    where: { id: joinRequestId },
    data: { status: decision, decidedAt: new Date() },
  });

  revalidatePath(`/${jr.wager.slug}`);
}
