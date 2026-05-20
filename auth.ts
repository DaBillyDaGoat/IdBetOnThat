import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { usernameFromDisplayName } from "@/lib/slug";
import { sendMagicLinkEmail } from "@/lib/email";

const adapter = PrismaAdapter(db);

adapter.createUser = (async (data: {
  email: string;
  emailVerified: Date | null;
  name?: string | null;
  image?: string | null;
}) => {
  const fallbackName =
    data.name?.trim() || (data.email ? data.email.split("@")[0] : "anon");
  const baseUsername = usernameFromDisplayName(fallbackName);

  let username = baseUsername;
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!exists) break;
    username = `${baseUsername}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const created = await db.user.create({
    data: {
      email: data.email,
      emailVerified: data.emailVerified ?? null,
      image: data.image ?? null,
      displayName: fallbackName,
      username,
    },
  });

  return { ...created, email: created.email ?? data.email };
}) as typeof adapter.createUser;

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?check-email=1",
    error: "/login?error=1",
  },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.EMAIL_FROM!,
      async sendVerificationRequest({ identifier: email, url }) {
        await sendMagicLinkEmail({ to: email, url });
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user?.id) {
        const u = await db.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            username: true,
            displayName: true,
            venmoUsername: true,
            isAdmin: true,
            ageVerified: true,
          },
        });
        if (u) Object.assign(session.user, u);
      }
      return session;
    },
  },
});
