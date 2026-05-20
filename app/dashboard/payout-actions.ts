"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Loser marks "I paid". */
export async function markPaid(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const payoutId = String(formData.get("payoutId") ?? "");
  if (!payoutId) throw new Error("Bad request");

  await db.$transaction(async (tx) => {
    const p = await tx.payout.findUnique({
      where: { id: payoutId },
      select: {
        fromUserId: true,
        toUserId: true,
        finalizedAt: true,
        paidMarkedByFromAt: true,
        receivedMarkedByToAt: true,
      },
    });
    if (!p) throw new Error("Payout not found");
    if (p.fromUserId !== userId) throw new Error("Not your payout to mark");
    if (p.finalizedAt) return; // already done

    const now = new Date();
    const update: {
      paidMarkedByFromAt?: Date;
      finalizedAt?: Date;
    } = {};
    update.paidMarkedByFromAt = now;
    // If the other side already confirmed, finalize now.
    if (p.receivedMarkedByToAt) {
      update.finalizedAt = now;
    }
    await tx.payout.update({ where: { id: payoutId }, data: update });

    if (update.finalizedAt) {
      // +1 paidUp for the payer.
      await tx.user.update({
        where: { id: p.fromUserId },
        data: { paidUpCount: { increment: 1 } },
      });
    }
  });

  revalidatePath("/dashboard");
}

/** Winner marks "Confirm received". */
export async function confirmReceived(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const payoutId = String(formData.get("payoutId") ?? "");
  if (!payoutId) throw new Error("Bad request");

  await db.$transaction(async (tx) => {
    const p = await tx.payout.findUnique({
      where: { id: payoutId },
      select: {
        fromUserId: true,
        toUserId: true,
        finalizedAt: true,
        paidMarkedByFromAt: true,
        receivedMarkedByToAt: true,
      },
    });
    if (!p) throw new Error("Payout not found");
    if (p.toUserId !== userId) throw new Error("Not yours to confirm");
    if (p.finalizedAt) return;

    const now = new Date();
    const update: {
      receivedMarkedByToAt?: Date;
      finalizedAt?: Date;
    } = {};
    update.receivedMarkedByToAt = now;
    if (p.paidMarkedByFromAt) {
      update.finalizedAt = now;
    }
    await tx.payout.update({ where: { id: payoutId }, data: update });

    if (update.finalizedAt) {
      await tx.user.update({
        where: { id: p.fromUserId },
        data: { paidUpCount: { increment: 1 } },
      });
    }
  });

  revalidatePath("/dashboard");
}
