"use client";

import * as React from "react";
import { Button } from "@/components/Button";

export function DeleteAccountForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [opened, setOpened] = React.useState(false);
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  if (!opened) {
    return (
      <Button variant="danger" onClick={() => setOpened(true)}>
        Delete my account
      </Button>
    );
  }

  return (
    <form
      action={async (fd) => {
        setBusy(true);
        try {
          await action(fd);
        } finally {
          setBusy(false);
        }
      }}
      className="flex flex-col gap-3"
    >
      <p className="text-sm">
        Type <code className="bg-white px-1 py-0.5 rounded">DELETE</code> to confirm.
      </p>
      <input
        type="text"
        name="confirm"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="h-10 px-3 rounded-xl border border-warn/40 bg-white text-sm focus:outline-none focus:border-warn"
        autoFocus
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpened(false);
            setConfirm("");
          }}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="danger"
          disabled={confirm !== "DELETE" || busy}
        >
          {busy ? "Deleting…" : "Delete forever"}
        </Button>
      </div>
    </form>
  );
}
