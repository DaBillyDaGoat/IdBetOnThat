// Payout math for idbetonthat.
// See PRD Section 7.
//
// Invariants (the tests pin these down):
//   1. All amounts are integer cents — never floats stored anywhere.
//   2. Sum of all payout transactions exactly equals sum of losers' net losses.
//   3. No self-pay: a single user is never both `from` and `to` on a payout.
//   4. Number of transactions ≤ max(N_losers, N_winners).
//   5. Equal-split is just pari-mutuel where every bet is the fixed amount.

export type BetInput = {
  userId: string;
  outcomeId: string;
  amountCents: number;
};

export type PayoutTxn = {
  fromUserId: string; // loser
  toUserId: string; // winner
  amountCents: number;
};

export type ImpliedOdds =
  | { hasBets: false }
  | {
      hasBets: true;
      /** Decimal odds, e.g. 3.33 means $1 returns $3.33 total. */
      decimal: number;
      /** Profit multiplier, e.g. 2.33 means $1 stake earns $2.33 profit. */
      profitMultiplier: number;
      /** American odds string, e.g. "+233" or "-150". */
      american: string;
    };

export type ResolutionResult =
  | {
      kind: "resolved";
      totalPoolCents: number;
      winningPoolCents: number;
      /** Map of userId → net cents. Positive = owed money, negative = owes money. */
      userNets: Map<string, number>;
      /** Greedy-netted payout transactions. */
      payouts: PayoutTxn[];
    }
  | {
      kind: "no_winners";
      /** Nobody bet on the winning outcome. PRD doesn't specify, so we surface
       *  this so the caller can void the wager and refund nothing (no money
       *  has moved yet — bets are commitments, not custody). */
      totalPoolCents: number;
    };

// ---------- helpers ----------

/**
 * Largest-remainder method. Distributes `totalCents` into `weights.length`
 * buckets proportional to `weights`, returning integer cents that sum to
 * exactly `totalCents`.
 *
 * Example: total=10000, weights=[1000, 2000] → ideal [3333.33, 6666.67]
 *   → floors [3333, 6666], remainder 1 → give to bucket with larger fractional
 *   part (bucket 1) → [3333, 6667]. Sum = 10000 ✓.
 */
export function distributeLargestRemainder(
  totalCents: number,
  weights: number[],
): number[] {
  if (totalCents < 0) throw new Error("totalCents must be ≥ 0");
  if (weights.some((w) => w < 0)) throw new Error("weights must be ≥ 0");

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight === 0) return weights.map(() => 0);

  const ideal = weights.map((w) => (w * totalCents) / totalWeight);
  const floors = ideal.map((x) => Math.floor(x));
  const allocated = floors.reduce((s, x) => s + x, 0);
  let leftover = totalCents - allocated;

  const remainders = ideal.map((x, i) => ({ idx: i, rem: x - floors[i] }));
  // Sort by remainder desc, then by weight desc as tie-breaker so the "largest
  // payout" gets the spare cent — matches PRD §7.5 ("favor of recipient").
  remainders.sort((a, b) =>
    b.rem !== a.rem ? b.rem - a.rem : weights[b.idx] - weights[a.idx],
  );

  const result = [...floors];
  for (let i = 0; i < leftover; i++) result[remainders[i].idx] += 1;
  return result;
}

/** Convert decimal odds (e.g. 3.33) to American odds string ("+233"). */
export function toAmerican(decimalOdds: number): string {
  if (!isFinite(decimalOdds) || decimalOdds <= 1) return "—";
  if (decimalOdds >= 2.0) {
    return `+${Math.round((decimalOdds - 1) * 100)}`;
  }
  return `-${Math.round(100 / (decimalOdds - 1))}`;
}

// ---------- live display: implied odds ----------

/**
 * Returns implied-odds for each outcome based on current pool state.
 * For display only — final payouts are recomputed at close.
 */
export function computeImpliedOdds(
  bets: BetInput[],
  outcomeIds: string[],
): Map<string, ImpliedOdds> {
  const outcomePools = new Map<string, number>();
  let totalPool = 0;
  for (const b of bets) {
    outcomePools.set(b.outcomeId, (outcomePools.get(b.outcomeId) ?? 0) + b.amountCents);
    totalPool += b.amountCents;
  }
  const result = new Map<string, ImpliedOdds>();
  for (const oid of outcomeIds) {
    const pool = outcomePools.get(oid) ?? 0;
    if (pool === 0 || totalPool === 0) {
      result.set(oid, { hasBets: false });
    } else {
      const decimal = totalPool / pool;
      const profitMultiplier = (totalPool - pool) / pool;
      result.set(oid, {
        hasBets: true,
        decimal,
        profitMultiplier,
        american: toAmerican(decimal),
      });
    }
  }
  return result;
}

// ---------- resolution: pari-mutuel ----------

/**
 * Resolve a pari-mutuel pool. Equal-split mode just calls this with all bets
 * already normalized to the fixed buy-in amount.
 */
export function resolvePariMutuel(
  bets: BetInput[],
  winningOutcomeId: string,
): ResolutionResult {
  // Aggregate per-user stakes and per-user winning stakes.
  const staked = new Map<string, number>();
  const wonStake = new Map<string, number>();
  for (const b of bets) {
    staked.set(b.userId, (staked.get(b.userId) ?? 0) + b.amountCents);
    if (b.outcomeId === winningOutcomeId) {
      wonStake.set(b.userId, (wonStake.get(b.userId) ?? 0) + b.amountCents);
    }
  }

  const totalPool = [...staked.values()].reduce((s, x) => s + x, 0);
  const winningPool = [...wonStake.values()].reduce((s, x) => s + x, 0);

  if (winningPool === 0) {
    return { kind: "no_winners", totalPoolCents: totalPool };
  }

  // Allocate totalPool to winners by their winning-stake share, using
  // largest-remainder so the cents sum exactly.
  const winners = [...wonStake.keys()];
  const wonStakes = winners.map((u) => wonStake.get(u)!);
  const grossPayouts = distributeLargestRemainder(totalPool, wonStakes);

  // Net = grossPayout - totalStaked.
  // (A user who bet on both winning and losing outcomes nets out automatically.)
  const userNets = new Map<string, number>();
  for (const [user, amt] of staked) userNets.set(user, -amt);
  winners.forEach((u, i) => userNets.set(u, (userNets.get(u) ?? 0) + grossPayouts[i]));

  const payouts = netTransactions(userNets);

  return {
    kind: "resolved",
    totalPoolCents: totalPool,
    winningPoolCents: winningPool,
    userNets,
    payouts,
  };
}

// ---------- transaction netting (Splitwise-style greedy match) ----------

/**
 * Greedy match of debtors → creditors. Guarantees no self-pay (we only build
 * positive vs negative buckets, and a single user is only in one bucket).
 */
export function netTransactions(userNets: Map<string, number>): PayoutTxn[] {
  const winners = [...userNets.entries()]
    .filter(([, n]) => n > 0)
    .map(([user, net]) => ({ user, amount: net }))
    .sort((a, b) => b.amount - a.amount);

  const losers = [...userNets.entries()]
    .filter(([, n]) => n < 0)
    .map(([user, net]) => ({ user, amount: -net }))
    .sort((a, b) => b.amount - a.amount);

  const payouts: PayoutTxn[] = [];
  let wi = 0;
  let li = 0;
  while (wi < winners.length && li < losers.length) {
    const w = winners[wi];
    const l = losers[li];
    const transfer = Math.min(w.amount, l.amount);
    if (transfer > 0) {
      payouts.push({
        fromUserId: l.user,
        toUserId: w.user,
        amountCents: transfer,
      });
    }
    w.amount -= transfer;
    l.amount -= transfer;
    if (w.amount === 0) wi++;
    if (l.amount === 0) li++;
  }
  return payouts;
}

// ---------- formatting helpers ----------

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}$${dollars.toLocaleString()}.${remainder.toString().padStart(2, "0")}`;
}

export function dollarsToCents(dollars: number): number {
  // Avoid float drift: round, don't trunc.
  return Math.round(dollars * 100);
}
