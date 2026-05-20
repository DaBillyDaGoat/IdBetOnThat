import Link from "next/link";
import { LinkButton } from "@/components/Button";

const examples = [
  {
    question: "Will the sourdough rise higher than last time?",
    pool: "$40",
    bettors: 3,
    tag: "Kitchen",
  },
  {
    question: "Who finishes the chili cookoff in first place?",
    pool: "$60",
    bettors: 6,
    tag: "Cookoff",
  },
  {
    question: "Will it rain on Sarah's wedding?",
    pool: "$25",
    bettors: 5,
    tag: "Weather",
  },
];

const steps = [
  {
    n: 1,
    title: "Create a wager",
    body: "Write the question and list the possible outcomes. Set a close time, or close it manually when you're ready.",
  },
  {
    n: 2,
    title: "Share the link",
    body: "Drop the URL in your group chat. Friends put money on the outcome they think will happen. Any amount, any side.",
  },
  {
    n: 3,
    title: "Settle it",
    body: "When it's decided, the math figures out who owes whom. We hand you Venmo links. Pay up.",
  },
];

const faq = [
  {
    q: "How does the math work?",
    a: "It's a pool. All the money on the losing sides gets split among the people who picked the winning side, proportional to how much they put in. Like a horse race or an office Oscar pool.",
  },
  {
    q: "Is this gambling?",
    a: "idbetonthat is a coordination and scorekeeping tool — like Splitwise for friendly bets. We don't hold money, we don't process payments, and we're not a counterparty to any wager. You and your friends settle up directly through Venmo.",
  },
  {
    q: "Does idbetonthat take a fee?",
    a: "No. 0% forever. Every dollar staked goes back to people in the wager.",
  },
  {
    q: "What if someone doesn't pay?",
    a: "We can't make anyone pay — these are honor-code agreements between friends. We do track who paid up and who didn't on public profiles, so reputation does the enforcing.",
  },
  {
    q: "Can I bet on sports?",
    a: "We're built for friendly pools between friends — chili cookoffs, sourdough rises, will-it-rain. Wagers based on professional sports outcomes are not the use case we're designed for.",
  },
  {
    q: "Who decides who won?",
    a: "Whoever created the wager picks the winning outcome when it's settled. If anyone in the wager disagrees, they can file a dispute, which shows publicly on the creator's profile.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="border-b border-ink/10">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-ink">
            Settle it with your friends.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-ink-muted max-w-2xl mx-auto">
            Make a wager, share the link, the math handles the rest.
            Honor code, no middleman.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <LinkButton href="/start" size="lg">
              Start a wager
            </LinkButton>
            <LinkButton href="#how" variant="secondary" size="lg">
              See how it works
            </LinkButton>
          </div>
        </div>
      </section>

      {/* ---------- Examples ---------- */}
      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink-muted text-center">
            People are wagering on
          </h2>
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {examples.map((ex) => (
              <article
                key={ex.question}
                className="border border-ink/10 rounded-2xl p-5 bg-paper hover:border-ink/30 transition-colors"
              >
                <div className="text-xs uppercase tracking-wider text-accent font-medium">
                  {ex.tag}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-ink leading-snug">
                  {ex.question}
                </h3>
                <div className="mt-6 flex items-baseline justify-between text-sm">
                  <span className="text-ink-muted">{ex.bettors} bettors</span>
                  <span className="font-semibold text-ink">{ex.pool} pool</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="border-b border-ink/10">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-center">
            How it works
          </h2>
          <div className="mt-12 grid sm:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="flex flex-col items-start">
                <div className="h-9 w-9 rounded-full bg-ink text-paper flex items-center justify-center font-semibold">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-ink-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Trust strip ---------- */}
      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-semibold">0%</div>
            <div className="mt-1 text-sm text-ink-muted">
              We don&rsquo;t take a cut.
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold">$0</div>
            <div className="mt-1 text-sm text-ink-muted">
              We don&rsquo;t hold your money.
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold">∞</div>
            <div className="mt-1 text-sm text-ink-muted">
              We just keep score.
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-center">
            Questions
          </h2>
          <div className="mt-12 divide-y divide-ink/10">
            {faq.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-lg font-medium">{item.q}</h3>
                  <span className="text-ink-muted group-open:rotate-45 transition-transform text-2xl leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-ink-muted leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <LinkButton href="/start" size="lg">
              Start a wager
            </LinkButton>
          </div>
          <p className="mt-6 text-center text-xs text-ink-muted">
            By using idbetonthat you agree to our{" "}
            <Link href="/terms" className="underline">Terms</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
            18+ only.
          </p>
        </div>
      </section>
    </>
  );
}
