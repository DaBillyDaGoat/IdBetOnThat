"use server";

import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const displayName = String(formData.get("displayName") ?? "").trim();
  const venmoUsername = String(formData.get("venmoUsername") ?? "").trim().replace(/^@/, "");

  if (displayName.length < 1 || displayName.length > 50) {
    throw new Error("Display name must be 1–50 characters.");
  }
  if (venmoUsername.length > 60) {
    throw new Error("Venmo username too long.");
  }

  await db.user.update({
    where: { id: userId },
    data: {
      displayName,
      venmoUsername: venmoUsername || null,
    },
  });

  revalidatePath("/settings");
}

/**
 * Account deletion per PRD §6.8:
 *  - Wipe PII (email, Venmo, displayName becomes "deleted user")
 *  - Retain bets/wagers/payouts so pool integrity is preserved
 *  - Profile page will 410 Gone (handled by `isDeleted` check)
 */
export async function deleteAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "DELETE") {
    throw new Error('Type "DELETE" to confirm.');
  }

  // We can't null `email` here because it's part of Auth.js's unique constraint;
  // instead we set it to a tombstone that's still unique per-user. Same for username.
  const tombstone = `deleted-${userId}@idbetonthat.invalid`;
  const tombstoneUsername = `deleted-${userId.slice(0, 12)}`;

  await db.$transaction(async (tx) => {
    // Wipe sessions and accounts so they're signed out everywhere.
    await tx.session.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });

    await tx.user.update({
      where: { id: userId },
      data: {
        email: tombstone,
        emailVerified: null,
        image: null,
        displayName: "deleted user",
        username: tombstoneUsername,
        venmoUsername: null,
        isDeleted: true,
      },
    });
  });

  // Sign out and redirect home.
  await signOut({ redirectTo: "/" });
}
