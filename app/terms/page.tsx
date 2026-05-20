export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-3 text-sm text-ink-muted">Last updated: TBD &middot; v0.1 draft</p>

      <div className="prose mt-8 space-y-6 text-ink leading-relaxed">
        <Section title="1. What idbetonthat is">
          idbetonthat is a coordination and tracking tool for friendly wagers
          between users who already know each other. It is not a gambling
          service, sportsbook, escrow service, payment processor, or
          counterparty to any wager.
        </Section>

        <Section title="2. We never touch money">
          idbetonthat does not hold, transfer, custody, or process funds of any
          kind. All payments between users happen externally, on platforms like
          Venmo, that the users themselves operate. idbetonthat takes 0% of any
          wager and earns no revenue from any pool.
        </Section>

        <Section title="3. Wagers are honor-based agreements">
          Every wager on this site is a personal agreement between the
          participants. We can show that one user owes another based on the
          outcome, but we cannot compel payment. You assume all risk of
          nonpayment by other users.
        </Section>

        <Section title="4. You must be 18 or older">
          By creating an account, you affirm you are at least 18 years old.
        </Section>

        <Section title="5. Prohibited wagers">
          You may not create wagers involving illegal activity, minors, harm to
          people or animals, insider information, fixed or pre-determined
          outcomes, or anything a reasonable person would find objectionable.
          We may remove wagers and ban users for any reason, at our sole
          discretion.
        </Section>

        <Section title="6. Resolution and disputes">
          The creator of a wager picks the winning outcome. Any participant may
          file a dispute within 48 hours of resolution, which is recorded
          publicly. We do not arbitrate or reverse resolutions.
        </Section>

        <Section title="7. Account deletion">
          You may delete your account at any time. We will remove your personal
          information; bet history may be retained in anonymized form so that
          the pools you participated in remain mathematically consistent.
        </Section>

        <Section title="8. No warranty">
          The service is provided as-is, without warranty of any kind.
        </Section>

        <Section title="9. Changes">
          We may update these terms. Material changes will be announced on the
          site. Continued use after changes constitutes acceptance.
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-ink-muted">{children}</p>
    </section>
  );
}
