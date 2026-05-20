export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 prose-styled">
      <h1 className="text-3xl font-semibold tracking-tight">About idbetonthat</h1>

      <p className="mt-6 text-ink-muted leading-relaxed">
        idbetonthat is a coordination and scorekeeping tool for friendly wagers
        between friends. Make a wager, share the link, let your group put money
        on whichever outcome they think will happen. When it&rsquo;s settled, we
        do the math, generate Venmo links, and track who paid up.
      </p>

      <p className="mt-4 text-ink-muted leading-relaxed">
        We don&rsquo;t hold any money. We don&rsquo;t take a cut. We&rsquo;re
        not a counterparty to any wager. Everything is honor code &mdash;
        between you and the people you actually know.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Why it exists</h2>
      <p className="mt-3 text-ink-muted leading-relaxed">
        Every friend group has running bets that never get tracked, settled, or
        remembered. A few bucks on whether it&rsquo;ll rain Saturday. Who
        finishes the chili cookoff first. Whether the sourdough rises higher
        this time. Real money, but a hassle to organize. We just wanted a clean
        way to do it.
      </p>

      <h2 className="mt-10 text-xl font-semibold">What we won&rsquo;t do</h2>
      <ul className="mt-3 text-ink-muted leading-relaxed list-disc pl-6 space-y-1">
        <li>Hold money in escrow.</li>
        <li>Take a cut of any wager. Ever.</li>
        <li>Set the odds. The pool sets them.</li>
        <li>Operate as a sportsbook or gambling service.</li>
      </ul>
    </article>
  );
}
