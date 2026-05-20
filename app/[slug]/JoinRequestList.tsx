"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { decideJoinRequest } from "./actions";

type Pending = {
  id: string;
  user: { displayName: string; username: string };
};

export function JoinRequestList({ pending }: { pending: Pending[] }) {
  if (pending.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
        Pending join requests
      </h2>
      <ul className="mt-3 border border-ink/10 rounded-2xl bg-white divide-y divide-ink/10">
        {pending.map((jr) => (
          <li key={jr.id} className="p-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{jr.user.displayName}</span>
            <div className="flex gap-2">
              <form action={decideJoinRequest}>
                <input type="hidden" name="joinRequestId" value={jr.id} />
                <input type="hidden" name="decision" value="APPROVE" />
                <Button type="submit" size="sm">Approve</Button>
              </form>
              <form action={decideJoinRequest}>
                <input type="hidden" name="joinRequestId" value={jr.id} />
                <input type="hidden" name="decision" value="REJECT" />
                <Button type="submit" size="sm" variant="ghost">Reject</Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
