"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { requestToJoin } from "./actions";

export function JoinRequestButton({ slug }: { slug: string }) {
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function action(formData: FormData) {
    setSubmitting(true);
    try {
      await requestToJoin(formData);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="text-sm text-ink-muted">
        Request sent. You&rsquo;ll be able to bet once the creator approves you.
      </div>
    );
  }

  return (
    <form action={action} className="flex items-center justify-between gap-3">
      <input type="hidden" name="slug" value={slug} />
      <div className="text-sm">
        This wager requires approval before you can bet.
      </div>
      <Button type="submit" disabled={submitting} size="sm">
        {submitting ? "Requesting…" : "Request to join"}
      </Button>
    </form>
  );
}
