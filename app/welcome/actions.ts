"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export async function completeWelcome(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const displayName = String(formData.get("displayName") ?? "").trim();
  const venmoUsername = String(formData.get("venmoUsername") ?? "").trim().replace(/^@/, "");
  const ageOk = formData.get("ageOk") === "on";
  const tosOk = formData.get("tosOk") === "on";
  const next = String(formData.get("next") ?? "/dashboard");

  if (!ageOk) throw new Error("You must confirm you're 18 or older.");
  if (!tosOk) throw new Error("You must agree to the Terms and Privacy Policy.");
  if (displayName.length < 1 || displayName.length > 50) {
    throw new Error("Display name must be 1–50 characters.");
  }

  await db.user.update({
    where: { id: userId },
    data: {
      displayName,
      venmoUsername: venmoUsername || null,
      ageVerified: true,
    },
  });

  redirect(next);
}
