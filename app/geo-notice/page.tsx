import Link from "next/link";
import { GeoContinueButton } from "./GeoContinueButton";

export const metadata = { title: "Heads up" };

type SearchParams = { next?: string };

export default async function GeoNoticePage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;
  const next = sp.next ?? "/";

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="border border-ink/10 rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Heads up</h1>
        <p className="mt-4 text-sm text-ink leading-relaxed">
          Some US states have rules that may apply to friendly wagers between
          individuals, even when no platform is taking a cut. Your state appears
          to be one of them.
        </p>
        <p className="mt-3 text-sm text-ink-muted leading-relaxed">
          idbetonthat is a coordination tool — we don&rsquo;t hold money, take a
          cut, or process payments. Honor-code agreements between you and your
          friends are still your responsibility.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <GeoContinueButton next={next} />
          <Link
            href="/"
            className="text-center text-sm text-ink-muted hover:text-ink"
          >
            Take me back home
          </Link>
        </div>
      </div>
    </div>
  );
}
