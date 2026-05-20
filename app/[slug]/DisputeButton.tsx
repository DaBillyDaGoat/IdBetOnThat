"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { fileDispute } from "./dispute-action";

export function DisputeButton({ slug }: { slug: string }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [filed, setFiled] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (filed) {
    return (
      <div className="text-sm text-ink-muted">
        Dispute filed. It&rsquo;s now visible on this wager and the creator&rsquo;s profile.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="text-sm text-warn underline self-start"
        onClick={() => setOpen(true)}
      >
        Dispute this resolution
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        setBusy(true);
        setError(null);
        try {
          await fileDispute(fd);
          setFiled(true);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed");
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-xl border border-warn/30 bg-warn/5 p-3 flex flex-col gap-2"
    >
      <input type="hidden" name="slug" value={slug} />
      <label className="text-sm font-medium text-warn">Dispute this resolution</label>
      <p className="text-xs text-ink-muted">
        Disputes appear publicly on this wager and on the creator&rsquo;s profile.
        We don&rsquo;t reverse resolutions — this is a reputation signal, not an appeal.
      </p>
      <textarea
        name="reason"
        rows={3}
        required
        minLength={4}
        maxLength={1000}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What's wrong with this resolution?"
        className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:outline-none focus:border-warn"
      />
      {error ? <div className="text-xs text-warn">{error}</div> : null}
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button size="sm" variant="danger" disabled={busy || reason.trim().length < 4}>
          {busy ? "Filing…" : "File dispute"}
        </Button>
      </div>
    </form>
  );
}
