// Module augmentation for Auth.js v5 so TypeScript knows about the extra
// fields our `session()` callback attaches to session.user.

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      displayName: string;
      venmoUsername: string | null;
      isAdmin: boolean;
      ageVerified: boolean;
    } & DefaultSession["user"];
  }
}
