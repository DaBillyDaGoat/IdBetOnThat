export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 text-sm text-ink-muted">Last updated: TBD &middot; v0.1 draft</p>

      <div className="mt-8 space-y-6">
        <Section title="What we collect">
          <ul className="list-disc pl-6 space-y-1">
            <li>Email address (for sign-in via magic link).</li>
            <li>Display name and chosen username.</li>
            <li>Venmo username, if you provide one.</li>
            <li>The wagers you create and bets you place.</li>
            <li>Standard request logs (IP, user agent) for security.</li>
          </ul>
        </Section>

        <Section title="What we don't collect">
          We do not collect payment information. We never see your Venmo
          balance, transaction history, or anything except the public username
          you give us so we can build deep-links.
        </Section>

        <Section title="What we share">
          We never sell or share your data with third parties for marketing.
          We may share data when required by law. Public profile pages display
          your display name, username, and aggregate wager statistics.
        </Section>

        <Section title="Cookies">
          We use cookies for authentication sessions. We may use a
          privacy-respecting analytics tool (Plausible) which does not use
          cross-site cookies and does not collect personal information.
        </Section>

        <Section title="Account deletion">
          You can delete your account from settings. We wipe your email, Venmo
          username, and personal identifiers. Your bet history is retained in
          anonymized form so the pools you participated in remain mathematically
          valid for other users.
        </Section>

        <Section title="Contact">
          Privacy questions: privacy@idbetonthat.com (set up post-launch).
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-ink-muted leading-relaxed">{children}</div>
    </section>
  );
}
