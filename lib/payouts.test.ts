import { describe, it, expect } from "vitest";
import {
  resolvePariMutuel,
  netTransactions,
  distributeLargestRemainder,
  computeImpliedOdds,
  toAmerican,
  formatCents,
  type BetInput,
} from "./payouts";

// =========================================================================
// PRD Section 2 canonical example: rain wager.
// A bets $10 on Yes, B bets $20 on Yes, C bets $30 on No, D bets $40 on No.
// Pool $100. Yes wins.
// A gets $33.33 net = +$23.33 ; B gets $66.67 net = +$46.67
// C owes $30 ; D owes $40
// =========================================================================
describe("PRD §2 rain wager", () => {
  const bets: BetInput[] = [
    { userId: "A", outcomeId: "yes", amountCents: 1000 },
    { userId: "B", outcomeId: "yes", amountCents: 2000 },
    { userId: "C", outcomeId: "no", amountCents: 3000 },
    { userId: "D", outcomeId: "no", amountCents: 4000 },
  ];

  it("yields the PRD's net positions", () => {
    const r = resolvePariMutuel(bets, "yes");
    expect(r.kind).toBe("resolved");
    if (r.kind !== "resolved") throw new Error("unreachable");
    expect(r.totalPoolCents).toBe(10000);
    expect(r.winningPoolCents).toBe(3000);
    // A's gross = 10000 * 1000/3000 = 3333.33 → 3333 ; net -1000 → +2333
    // B's gross = 10000 * 2000/3000 = 6666.67 → 6667 ; net -2000 → +4667
    expect(r.userNets.get("A")).toBe(2333);
    expect(r.userNets.get("B")).toBe(4667);
    expect(r.userNets.get("C")).toBe(-3000);
    expect(r.userNets.get("D")).toBe(-4000);
  });

  it("sum of nets is zero (pool integrity)", () => {
    const r = resolvePariMutuel(bets, "yes");
    if (r.kind !== "resolved") throw new Error("unreachable");
    const sum = [...r.userNets.values()].reduce((s, x) => s + x, 0);
    expect(sum).toBe(0);
  });

  it("sum of payouts equals sum of losers' losses", () => {
    const r = resolvePariMutuel(bets, "yes");
    if (r.kind !== "resolved") throw new Error("unreachable");
    const sumPayouts = r.payouts.reduce((s, p) => s + p.amountCents, 0);
    expect(sumPayouts).toBe(7000); // C $30 + D $40
  });

  it("uses at most max(N_losers,N_winners) transactions", () => {
    const r = resolvePariMutuel(bets, "yes");
    if (r.kind !== "resolved") throw new Error("unreachable");
    // 2 losers, 2 winners → at most 3 transactions (greedy can need W+L-1).
    expect(r.payouts.length).toBeLessThanOrEqual(3);
  });

  it("no user appears as both `from` and `to`", () => {
    const r = resolvePariMutuel(bets, "yes");
    if (r.kind !== "resolved") throw new Error("unreachable");
    for (const p of r.payouts) {
      expect(p.fromUserId).not.toBe(p.toUserId);
    }
  });
});

// =========================================================================
// distributeLargestRemainder
// =========================================================================
describe("distributeLargestRemainder", () => {
  it("sums to total even with awkward divisions", () => {
    const result = distributeLargestRemainder(100, [1, 1, 1]);
    expect(result.reduce((s, x) => s + x, 0)).toBe(100);
    // 33.33 each → 33,33,34 (one bucket gets the extra cent)
    expect(result.filter((x) => x === 34).length).toBe(1);
    expect(result.filter((x) => x === 33).length).toBe(2);
  });

  it("handles zero weights without divide-by-zero", () => {
    expect(distributeLargestRemainder(100, [0, 0])).toEqual([0, 0]);
  });

  it("handles single bucket", () => {
    expect(distributeLargestRemainder(537, [1])).toEqual([537]);
  });

  it("breaks remainder ties by giving spare cent to larger weight", () => {
    // 1 cent over 2 equal-weighted buckets: tie. Tie-break to larger weight.
    // Here weights are equal so first wins.
    const result = distributeLargestRemainder(1, [50, 50]);
    expect(result.reduce((s, x) => s + x, 0)).toBe(1);
  });
});

// =========================================================================
// Edge cases
// =========================================================================
describe("edge cases", () => {
  it("single bettor on winning outcome → no payouts, net zero", () => {
    const r = resolvePariMutuel(
      [{ userId: "A", outcomeId: "yes", amountCents: 5000 }],
      "yes",
    );
    if (r.kind !== "resolved") throw new Error("unreachable");
    expect(r.userNets.get("A")).toBe(0);
    expect(r.payouts).toEqual([]);
  });

  it("everyone bet on winning outcome → all break even, no payouts", () => {
    const r = resolvePariMutuel(
      [
        { userId: "A", outcomeId: "yes", amountCents: 1000 },
        { userId: "B", outcomeId: "yes", amountCents: 2000 },
        { userId: "C", outcomeId: "yes", amountCents: 3000 },
      ],
      "yes",
    );
    if (r.kind !== "resolved") throw new Error("unreachable");
    expect(r.userNets.get("A")).toBe(0);
    expect(r.userNets.get("B")).toBe(0);
    expect(r.userNets.get("C")).toBe(0);
    expect(r.payouts).toEqual([]);
  });

  it("nobody bet on winning outcome → no_winners", () => {
    const r = resolvePariMutuel(
      [
        { userId: "A", outcomeId: "no", amountCents: 1000 },
        { userId: "B", outcomeId: "no", amountCents: 2000 },
      ],
      "yes",
    );
    expect(r.kind).toBe("no_winners");
    if (r.kind !== "no_winners") throw new Error("unreachable");
    expect(r.totalPoolCents).toBe(3000);
  });

  it("user bet on both winning and losing — nets out correctly", () => {
    // A bets $10 on Yes AND $10 on No. B bets $10 on Yes. C bets $10 on No.
    // Pool = $40. Yes pool = $20 (A:10 + B:10). Yes wins.
    // A's gross = 40 * 10/20 = $20. A's net = $20 - $20 staked = $0.
    // B's gross = 40 * 10/20 = $20. B's net = $20 - $10 staked = +$10.
    // C: net -$10.
    const r = resolvePariMutuel(
      [
        { userId: "A", outcomeId: "yes", amountCents: 1000 },
        { userId: "A", outcomeId: "no", amountCents: 1000 },
        { userId: "B", outcomeId: "yes", amountCents: 1000 },
        { userId: "C", outcomeId: "no", amountCents: 1000 },
      ],
      "yes",
    );
    if (r.kind !== "resolved") throw new Error("unreachable");
    expect(r.userNets.get("A")).toBe(0);
    expect(r.userNets.get("B")).toBe(1000);
    expect(r.userNets.get("C")).toBe(-1000);
    // C should pay B $10, A is uninvolved in payouts.
    expect(r.payouts).toHaveLength(1);
    expect(r.payouts[0]).toMatchObject({
      fromUserId: "C",
      toUserId: "B",
      amountCents: 1000,
    });
  });

  it("messy pennies — many bettors, awkward proportions, still balances", () => {
    const bets: BetInput[] = [];
    for (let i = 0; i < 17; i++) {
      bets.push({
        userId: `winner${i}`,
        outcomeId: "yes",
        amountCents: 100 + i * 37, // varying odd amounts
      });
    }
    for (let i = 0; i < 13; i++) {
      bets.push({
        userId: `loser${i}`,
        outcomeId: "no",
        amountCents: 250 + i * 53,
      });
    }
    const r = resolvePariMutuel(bets, "yes");
    if (r.kind !== "resolved") throw new Error("unreachable");

    // Pool integrity
    const sumNets = [...r.userNets.values()].reduce((s, x) => s + x, 0);
    expect(sumNets).toBe(0);

    const sumLosses = [...r.userNets.values()]
      .filter((n) => n < 0)
      .reduce((s, n) => s - n, 0);
    const sumPayouts = r.payouts.reduce((s, p) => s + p.amountCents, 0);
    expect(sumPayouts).toBe(sumLosses);

    // Greedy bound: ≤ W + L - 1 = 17 + 13 - 1
    expect(r.payouts.length).toBeLessThanOrEqual(29);
  });
});

// =========================================================================
// Netting
// =========================================================================
describe("netTransactions", () => {
  it("returns empty if no nets", () => {
    expect(netTransactions(new Map())).toEqual([]);
  });
  it("returns empty if all zero", () => {
    expect(netTransactions(new Map([["A", 0]]))).toEqual([]);
  });
  it("one debtor pays one creditor", () => {
    const txns = netTransactions(new Map([["A", 100], ["B", -100]]));
    expect(txns).toEqual([{ fromUserId: "B", toUserId: "A", amountCents: 100 }]);
  });
});

// =========================================================================
// Implied odds
// =========================================================================
describe("computeImpliedOdds", () => {
  it("matches PRD example", () => {
    const bets: BetInput[] = [
      { userId: "A", outcomeId: "yes", amountCents: 1000 },
      { userId: "B", outcomeId: "yes", amountCents: 2000 },
      { userId: "C", outcomeId: "no", amountCents: 3000 },
      { userId: "D", outcomeId: "no", amountCents: 4000 },
    ];
    const odds = computeImpliedOdds(bets, ["yes", "no"]);
    const yes = odds.get("yes");
    const no = odds.get("no");
    if (!yes || !yes.hasBets) throw new Error("yes should have bets");
    if (!no || !no.hasBets) throw new Error("no should have bets");
    // Yes pool 30, total 100 → decimal 100/30 = 3.33, profit 2.33
    expect(yes.decimal).toBeCloseTo(3.333, 2);
    expect(yes.profitMultiplier).toBeCloseTo(2.333, 2);
    // No pool 70 → decimal 100/70 = 1.428
    expect(no.decimal).toBeCloseTo(1.428, 2);
  });
  it("returns hasBets:false for outcomes with no bets", () => {
    const odds = computeImpliedOdds([], ["yes", "no"]);
    expect(odds.get("yes")).toEqual({ hasBets: false });
    expect(odds.get("no")).toEqual({ hasBets: false });
  });
});

describe("toAmerican", () => {
  it("underdogs (decimal ≥ 2) → positive American", () => {
    expect(toAmerican(2.0)).toBe("+100");
    expect(toAmerican(3.33)).toBe("+233");
  });
  it("favorites (1 < decimal < 2) → negative American", () => {
    expect(toAmerican(1.5)).toBe("-200");
    expect(toAmerican(1.4286)).toBe("-233");
  });
  it("invalid → em dash", () => {
    expect(toAmerican(0.5)).toBe("—");
    expect(toAmerican(1.0)).toBe("—");
  });
});

describe("formatCents", () => {
  it("renders dollars and cents", () => {
    expect(formatCents(1234)).toBe("$12.34");
    expect(formatCents(100)).toBe("$1.00");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(-1234)).toBe("-$12.34");
    expect(formatCents(100000)).toBe("$1,000.00");
  });
});
