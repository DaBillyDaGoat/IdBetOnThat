"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { resolveWagerInTx } from "@/lib/resolve";

// ---------- closeWager ----------

export async function closeWager(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const slug = String(formData.get("slug") ?? "");
  if (!slug) throw new Error("Bad request");

  await db.$transaction(async (tx) => {
    const w = await tx.wager.findUnique({
      where: { slug },
      select: { id: true, creatorId: true, status: true },
    });
    if (!w) throw new Error("Wager not found");
    if (w.creatorId !== userId) throw new Error("Only the creator can close");
    if (w.status !== "OPEN") throw new Error("Wager is not open");

    await tx.wager.update({
      where: { id: w.id },
      data: { status: "AWAITING_RESOLUTION", closedAt: new Date() },
    });
  });

  revalidatePath(`/${slug}`);
}

// ---------- pickWinner ----------

export async function pickWinner(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const slug = String(formData.get("slug") ?? "");
  const winningOutcomeId = String(formData.get("winningOutcomeId") ?? "");
  if (!slug || !winningOutcomeId) throw new Error("Bad request");

  await db.$transaction(async (tx) => {
    const w = await tx.wager.findUnique({
      where: { slug },
      select: { id: true, creatorId: true, status: true },
    });
    if (!w) throw new Error("Wager not found");
    if (w.creatorId !== userId) throw new Error("Only the creator can resolve");
    // If it's still OPEN, flip to AWAITING_RESOLUTION first so resolveWagerInTx accepts it.
    if (w.status === "OPEN") {
      await tx.wager.update({
        where: { id: w.id },
        data: { status: "AWAITING_RESOLUTION", closedAt: new Date() },
      });
    }
    await resolveWagerInTx(tx, { wagerId: w.id, winningOutcomeId });
  });

  revalidatePath(`/${slug}`);
}

// ---------- voidWager ----------

export async function voidWager(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const slug = String(formData.get("slug") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!slug) throw new Error("Bad request");

  await db.$transaction(async (tx) => {
    const w = await tx.wager.findUnique({
      where: { slug },
      select: { id: true, creatorId: true, status: true },
    });
    if (!w) throw new Error("Wager not found");
    if (w.creatorId !== userId) throw new Error("Only the creator can void");
    if (w.status === "RESOLVED" || w.status === "VOID") {
      throw new Error(`Cannot void a wager in status ${w.status}`);
    }
    await tx.wager.update({
      where: { id: w.id },
      data: {
        status: "VOID",
        resolutionNote: note,
        resolvedAt: new Date(),
        closedAt: w.status === "OPEN" ? new Date() : undefined,
      },
    });
  });

  revalidatePath(`/${slug}`);
}
