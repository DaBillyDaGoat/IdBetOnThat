"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { placeBet } from "./actions";

type Outcome = { id: string; label: string };

type Props = {
  slug: string;
  outcomes: Outcome[];
  mode: "PARIMUTUEL" | "EQUAL_SPLIT";
  equalSplitCents: number | null;
  needsVenmo: boolean;
};

export function BetForm({ slug, outcomes, mode, equalSplitCents, needsVenmo }: Props) {
  const [outcomeId, setOutcomeId] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const fixedAmount = mode === "EQUAL_SPLIT" && equalSplitCents
    ? (equalSplitCents / 100).toFixed(2)
    : null;

  async function action(formData: FormData) {
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await placeBet(formData);
      setSuccess(true);
      // Clear amount on success (server will revalidate the page).
      (document.getElementById("bet-amount") as HTMLInputElement | null)?.value && void 0;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't place bet");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />

      <div>
        <div className="text-xs uppercase tracking-wider text-ink-muted mb-2">
          Pick outcome
        </div>
        <div className="flex flex-wrap gap-2">
          {outcomes.map((o) => (
            <label
              key={o.id}
              className={`cursor-pointer text-sm px-3 py-1.5 rounded-full border transition-colors ${
                outcomeId === o.id
                  ? "bg-accent text-white border-accent"
                  : "bg-white border-ink/15 hover:border-ink/40"
              }`}
            >
              <input
                type="radio"
                name="outcomeId"
                value={o.id}
                checked={outcomeId === o.id}
                onChange={() => setOutcomeId(o.id)}
                className="sr-only"
                required
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="bet-amount"
            className="text-xs uppercase tracking-wider text-ink-muted block mb-1"
          >
            Amount ($)
          </label>
          <input
            id="bet-amount"
            type="number"
            name="amount"
            min={1}
            step="0.01"
            placeholder="10"
            defaultValue={fixedAmount ?? ""}
            readOnly={!!fixedAmount}
            required
            className="h-10 w-full px-3 rounded-xl border border-ink/15 bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 read-only:bg-paper-soft"
          />
        </div>
        <Button type="submit" size="md" disabled={submitting || !outcomeId}>
          {submitting ? "Placing…" : "Place bet"}
        </Button>
      </div>

      {needsVenmo ? (
        <div>
          <label
            htmlFor="venmo"
            className="text-xs uppercase tracking-wider text-ink-muted block mb-1"
          >
            Venmo username
          </label>
          <input
            id="venmo"
            type="text"
            name="venmoUsername"
            placeholder="your-venmo"
            required
            className="h-10 w-full px-3 rounded-xl border border-ink/15 bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <p className="mt-1 text-xs text-ink-muted">
            Used to generate Venmo payment links when the wager settles. We never see your transactions.
          </p>
        </div>
      ) : null}

      {fixedAmount ? (
        <p className="text-xs text-ink-muted">
          Equal-split mode — fixed buy-in of ${fixedAmount}. One bet per person.
        </p>
      ) : null}

      {error ? (
        <div className="rounded-lg bg-warn/10 border border-warn/30 px-3 py-2 text-sm text-warn">
          {error}
        </div>
      ) : null}
      {success && !error ? (
        <div className="rounded-lg bg-accent/10 border border-accent/30 px-3 py-2 text-sm text-accent-dark">
          Bet placed.
        </div>
      ) : null}
    </form>
  );
}
