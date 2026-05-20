"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateSlug } from "@/lib/slug";
import { redirect } from "next/navigation";

const CreateWagerInput = z.object({
  question: z.string().trim().min(3, "Question is too short").max(280),
  description: z.string().trim().max(2000).optional().nullable(),
  outcomes: z.array(z.string().trim().min(1, "Outcome cannot be empty").max(80))
    .min(2, "Need at least 2 outcomes")
    .max(10, "Max 10 outcomes"),
  mode: z.enum(["PARIMUTUEL", "EQUAL_SPLIT"]),
  equalSplitCents: z.number().int().min(100).optional().nullable(),
  closeType: z.enum(["TIMED", "MANUAL"]),
  closeAt: z.string().datetime().optional().nullable(),
  accessMode: z.enum(["OPEN", "APPROVAL_REQUIRED"]),
  isPublic: z.boolean(),
  anonymousBets: z.boolean(),
});

export async function createWager(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/start");
  const userId = session.user.id;

  // Pull outcomes from outcome-0, outcome-1, ... up to outcome-9.
  const outcomes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const v = formData.get(`outcome-${i}`);
    if (typeof v === "string" && v.trim().length > 0) outcomes.push(v.trim());
  }

  const closeType = formData.get("closeType") === "TIMED" ? "TIMED" : "MANUAL";
  const mode = formData.get("mode") === "EQUAL_SPLIT" ? "EQUAL_SPLIT" : "PARIMUTUEL";
  const closeAtRaw = formData.get("closeAt");
  const equalSplitDollars = formData.get("equalSplit");

  const raw = {
    question: String(formData.get("question") ?? ""),
    description: (formData.get("description") as string) || null,
    outcomes,
    mode,
    equalSplitCents:
      mode === "EQUAL_SPLIT" && equalSplitDollars
        ? Math.round(Number(equalSplitDollars) * 100)
        : null,
    closeType,
    closeAt:
      closeType === "TIMED" && closeAtRaw
        ? new Date(String(closeAtRaw)).toISOString()
        : null,
    accessMode:
      formData.get("accessMode") === "APPROVAL_REQUIRED"
        ? "APPROVAL_REQUIRED"
        : "OPEN",
    isPublic: formData.get("isPublic") === "on",
    anonymousBets: formData.get("anonymousBets") === "on",
  };

  const parsed = CreateWagerInput.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(msg);
  }
  const data = parsed.data;

  if (data.closeType === "TIMED" && !data.closeAt) {
    throw new Error("Pick a close time.");
  }
  if (data.mode === "EQUAL_SPLIT" && !data.equalSplitCents) {
    throw new Error("Pick a buy-in amount for equal-split.");
  }

  // Slug-uniqueness retry loop. Collision odds are tiny with our alphabet but
  // we retry a few times to be safe.
  let slug: string | null = null;
  for (let i = 0; i < 5; i++) {
    const candidate = generateSlug();
    const exists = await db.wager.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) {
      slug = candidate;
      break;
    }
  }
  if (!slug) throw new Error("Couldn't generate a unique slug. Try again.");

  const wager = await db.wager.create({
    data: {
      slug,
      creatorId: userId,
      question: data.question,
      description: data.description,
      mode: data.mode,
      equalSplitCents: data.equalSplitCents,
      closeType: data.closeType,
      closeAt: data.closeAt ? new Date(data.closeAt) : null,
      accessMode: data.accessMode,
      isPublic: data.isPublic,
      anonymousBets: data.anonymousBets,
      outcomes: {
        create: data.outcomes.map((label, order) => ({ label, order })),
      },
    },
    select: { slug: true },
  });

  // Bump creator's counter.
  await db.user.update({
    where: { id: userId },
    data: { wagersCreated: { increment: 1 } },
  });

  redirect(`/${wager.slug}`);
}
