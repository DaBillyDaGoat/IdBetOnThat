import { LinkButton } from "@/components/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-3 text-ink-muted">
        That page doesn&rsquo;t exist, or the wager link is wrong.
      </p>
      <div className="mt-8">
        <LinkButton href="/">Back home</LinkButton>
      </div>
    </div>
  );
}
