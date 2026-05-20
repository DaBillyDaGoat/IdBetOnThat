import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper-soft mt-16">
      <div className="mx-auto max-w-5xl px-4 py-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">
          We don&rsquo;t hold your money. We just keep score.
        </p>
        <nav className="flex flex-wrap gap-4 text-sm text-ink-muted">
          <Link href="/about" className="hover:text-ink">About</Link>
          <Link href="/faq" className="hover:text-ink">FAQ</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
