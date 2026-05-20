import Link from "next/link";
import { auth, signOut } from "@/auth";
import { LinkButton, Button } from "./Button";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b border-ink/10 bg-paper/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-ink">
          idbetonthat
        </Link>
        <nav className="flex items-center gap-2">
          {user?.username ? (
            <>
              <LinkButton href="/dashboard" variant="ghost" size="sm">
                Dashboard
              </LinkButton>
              <LinkButton href="/start" variant="primary" size="sm">
                Start a wager
              </LinkButton>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Sign in
              </LinkButton>
              <LinkButton href="/start" variant="primary" size="sm">
                Start a wager
              </LinkButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
