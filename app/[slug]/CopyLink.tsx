"use client";

import * as React from "react";
import { Button } from "@/components/Button";

export function CopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handle() {
    const url = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be unavailable in some browsers/iframes.
      window.prompt("Copy this URL:", url);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={handle}>
        {copied ? "Copied!" : "Copy share link"}
      </Button>
      <span className="text-xs text-ink-muted truncate">
        idbetonthat.com/{slug}
      </span>
    </div>
  );
}
