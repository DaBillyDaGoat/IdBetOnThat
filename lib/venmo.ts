// Venmo deep-link builder. We never see the actual payment — this just opens
// the Venmo composer pre-filled. The user confirms/sends in Venmo.

/**
 * Build a Venmo deep link. Works on both web and mobile (Venmo's URL handler
 * catches it on iOS/Android).
 *
 * The `recipients` param accepts a Venmo username (without the `@`).
 * `note` is the memo line the recipient sees.
 */
export function buildVenmoUrl(args: {
  recipientUsername: string;
  amountCents: number;
  note: string;
}): string {
  const params = new URLSearchParams({
    txn: "pay",
    recipients: args.recipientUsername.replace(/^@/, ""),
    amount: (args.amountCents / 100).toFixed(2),
    note: args.note,
  });
  return `https://venmo.com/?${params.toString()}`;
}

/** Wager-payment note convention; keep short — Venmo truncates at ~200 chars. */
export function payoutNote(args: { wagerQuestion: string }): string {
  const trimmedQuestion = args.wagerQuestion.slice(0, 120);
  return `idbetonthat: ${trimmedQuestion}`;
}
