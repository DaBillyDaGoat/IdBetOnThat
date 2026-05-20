"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { closeWager, pickWinner, voidWager } from "./resolve-actions";

type Props = {
  wager: {
    slug: string;
    outcomes: { id: string; label: string }[];
  };
  phase: "close" | "resolve";
};

export function CloseAndResolve({ wager, phase }: Props) {
  const [confirming, setConfirming] = React.useState<
    "close" | "pick" | "void" | null
  >(null);
  const [winningId, setWinningId] = React.useState<string>("");
  const [voidNote, setVoidNote] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function run(fn: (fd: FormData) => Promise<void>, fd: FormData) {
    setBusy(true);
    setError(null);
    try {
      await fn(fd);
      setConfirming(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (phase === "close") {
    // Status = OPEN, creator can close early or void if no bets matter.
    return (
      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wider text-ink-muted">
          You created this wager
        </div>
        {confirming === "close" ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">Close now? No more bets after this.</span>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => {
                const fd = new FormData();
                fd.set("slug", wager.slug);
                run(closeWager, fd);
              }}
            >
              Yes, close
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(null)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setConfirming("close")}>
              Close wager now
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming("void")}>
              Void wager
            </Button>
          </div>
        )}
        {confirming === "void" ? (
          <VoidForm
            wager={wager}
            note={voidNote}
            setNote={setVoidNote}
            busy={busy}
            onCancel={() => setConfirming(null)}
            onConfirm={() => {
              const fd = new FormData();
              fd.set("slug", wager.slug);
              if (voidNote.trim()) fd.set("note", voidNote.trim());
              run(voidWager, fd);
            }}
          />
        ) : null}
        {error ? (
          <div className="text-sm text-warn">{error}</div>
        ) : null}
      </div>
    );
  }

  // phase === "resolve"
  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs uppercase tracking-wider text-ink-muted">
        Pick the winning outcome
      </div>
      <div className="flex flex-wrap gap-2">
        {wager.outcomes.map((o) => (
          <label
            key={o.id}
            className={`cursor-pointer text-sm px-3 py-1.5 rounded-full border ${
              winningId === o.id
                ? "bg-accent text-white border-accent"
                : "bg-white border-ink/15 hover:border-ink/40"
            }`}
          >
            <input
              type="radio"
              name="winningOutcomeId"
              value={o.id}
              checked={winningId === o.id}
              onChange={() => setWinningId(o.id)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="md"
          disabled={!winningId || busy}
          onClick={() => {
            const fd = new FormData();
            fd.set("slug", wager.slug);
            fd.set("winningOutcomeId", winningId);
            if (confirm("Lock in this winner? Payouts get created and can't be undone.")) {
              run(pickWinner, fd);
            }
          }}
        >
          {busy ? "Resolving…" : "Lock in winner"}
        </Button>
        <Button
          size="md"
          variant="ghost"
          disabled={busy}
          onClick={() => setConfirming("void")}
        >
          Void instead
        </Button>
      </div>
      {confirming === "void" ? (
        <VoidForm
          wager={wager}
          note={voidNote}
          setNote={setVoidNote}
          busy={busy}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const fd = new FormData();
            fd.set("slug", wager.slug);
            if (voidNote.trim()) fd.set("note", voidNote.trim());
            run(voidWager, fd);
          }}
        />
      ) : null}
      {error ? <div className="text-sm text-warn">{error}</div> : null}
    </div>
  );
}

function VoidForm(props: {
  wager: { slug: string };
  note: string;
  setNote: (v: string) => void;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="mt-2 rounded-xl border border-ink/10 bg-white p-3 flex flex-col gap-2">
      <label className="text-sm font-medium">Void this wager?</label>
      <p className="text-xs text-ink-muted">
        No payouts created. Bets are cleared from the books.
      </p>
      <input
        type="text"
        value={props.note}
        onChange={(e) => props.setNote(e.target.value)}
        placeholder="Optional reason"
        maxLength={200}
        className="h-9 px-3 rounded-lg border border-ink/15 text-sm focus:outline-none focus:border-accent"
      />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={props.onCancel} disabled={props.busy}>
          Cancel
        </Button>
        <Button size="sm" variant="danger" onClick={props.onConfirm} disabled={props.busy}>
          {props.busy ? "Voiding…" : "Void it"}
        </Button>
      </div>
    </div>
  );
}
