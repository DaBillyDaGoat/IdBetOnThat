"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { markPaid, confirmReceived } from "./payout-actions";

export function MarkPaidButton({ payoutId }: { payoutId: string }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <form
      action={async (fd) => {
        setBusy(true);
        try {
          await markPaid(fd);
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="payoutId" value={payoutId} />
      <Button size="sm" variant="secondary" disabled={busy}>
        {busy ? "Marking…" : "I paid"}
      </Button>
    </form>
  );
}

export function ConfirmReceivedButton({ payoutId }: { payoutId: string }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <form
      action={async (fd) => {
        setBusy(true);
        try {
          await confirmReceived(fd);
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="payoutId" value={payoutId} />
      <Button size="sm" disabled={busy}>
        {busy ? "Confirming…" : "Confirm received"}
      </Button>
    </form>
  );
}
