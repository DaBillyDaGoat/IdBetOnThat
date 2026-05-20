import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export const metadata = { title: "Sign in" };

type SearchParams = {
  "check-email"?: string;
  error?: string;
  next?: string;
};

export default async function LoginPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  const sp = await props.searchParams;

  // If already signed in, bounce to dashboard (or wherever they came from).
  if (session?.user) {
    redirect(sp.next ?? "/dashboard");
  }

  const checkEmail = sp["check-email"] === "1";
  const hadError = sp.error === "1";

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="border border-ink/10 rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {checkEmail ? "Check your email" : "Sign in"}
        </h1>

        {checkEmail ? (
          <div className="mt-4 text-ink-muted text-sm leading-relaxed">
            We sent you a sign-in link. Click it from the same device or browser
            you started from. If it doesn&rsquo;t arrive in a minute, check your
            spam folder.
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-muted">
              We&rsquo;ll email you a sign-in link. No password.
            </p>

            {hadError ? (
              <div className="mt-4 rounded-xl bg-warn/10 border border-warn/30 px-3 py-2 text-sm text-warn">
                Something went wrong. Try again, or check the email address.
              </div>
            ) : null}

            <form
              action={async (formData: FormData) => {
                "use server";
                const email = String(formData.get("email") ?? "").trim();
                if (!email) return;
                // Auth.js will send the verification email via our Resend
                // provider and redirect to /login?check-email=1.
                await signIn("resend", {
                  email,
                  redirectTo: sp.next ?? "/dashboard",
                });
              }}
              className="mt-6 flex flex-col gap-4"
            >
              <Input
                type="email"
                name="email"
                label="Email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
              />
              <Button type="submit" size="lg">
                Email me a sign-in link
              </Button>
            </form>

            <p className="mt-6 text-xs text-ink-muted">
              By signing in you agree to our{" "}
              <a href="/terms" className="underline">Terms</a> and{" "}
              <a href="/privacy" className="underline">Privacy Policy</a>.
              You must be 18 or older.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
