import Link from "next/link";

export const metadata = { title: "FAQ" };

const faqs = [
  {
    q: "How does the math work?",
    a: "It's a pari-mutuel pool — like horse racing or an office Oscar pool. All bets on losing outcomes get distributed to winners proportional to how much each winner staked. The pool always balances by construction.",
  },
  {
    q: "Is this gambling?",
    a: "idbetonthat is a coordination and scorekeeping tool for friendly bets among people who know each other, like Splitwise but for wagers. We don't hold or move money. We don't take fees. You settle up directly through Venmo.",
  },
  {
    q: "Does idbetonthat take a fee?",
    a: "No, 0% forever. Every dollar staked goes back to the people in the wager.",
  },
  {
    q: "What if someone doesn't pay?",
    a: "We can't force anyone to pay — these are honor agreements. We do track who paid up and who didn't on public profiles. Reputation does the enforcing.",
  },
  {
    q: "Can I bet on sports?",
    a: "We're designed for personal, friendly wagers — chili cookoffs, sourdough rises, will-it-rain. We don't optimize for sports betting and we'd rather you didn't.",
  },
  {
    q: "Who decides who won?",
    a: "The person who created the wager picks the winning outcome. If anyone disagrees, they can file a dispute within 48 hours, which shows publicly on the creator's profile.",
  },
  {
    q: "What if the wager creator ghosts?",
    a: "If a wager goes 30 days past its close date without being resolved, we automatically void it and flag the creator's profile.",
  },
  {
    q: "Can I edit or cancel my bet?",
    a: "Once placed, bets can't be edited or withdrawn. If you want to hedge, place a new bet on a different outcome.",
  },
  {
    q: "What happens if I delete my account?",
    a: "We wipe your personal info (email, Venmo handle, display name becomes 'deleted user'), but your historical bets stay attached anonymously so the pools you participated in stay mathematically valid.",
  },
];

export default function FAQPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">FAQ</h1>
      <div className="mt-10 divide-y divide-ink/10">
        {faqs.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h2 className="text-lg font-medium">{f.q}</h2>
              <span className="text-ink-muted group-open:rotate-45 transition-transform text-2xl leading-none">
                +
              </span>
            </summary>
            <p className="mt-3 text-ink-muted leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-10 text-sm text-ink-muted">
        Still got questions? Reach out via the contact info in our{" "}
        <Link href="/about" className="underline">about page</Link>.
      </p>
    </article>
  );
}
