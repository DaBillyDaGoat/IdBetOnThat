import { describe, it, expect } from "vitest";
import { resolveWagerInTx } from "./resolve";

// Hand-rolled fake of just the slice of Prisma that resolveWagerInTx touches.
// Lets us test the accounting logic without a real database.

type BetRow = { userId: string; outcomeId: string; amountCents: number };
type WagerRow = {
  id: string;
  status: "OPEN" | "CLOSED" | "AWAITING_RESOLUTION" | "RESOLVED" | "VOID";
  outcomes: { id: string }[];
  bets: BetRow[];
  winningOutcomeId?: string | null;
  resolvedAt?: Date | null;
  resolutionNote?: string | null;
};
type UserCounters = {
  winsCount: number;
  lossesCount: number;
  totalWonCents: number;
  totalLostCents: number;
  paidUpCount: number;
  welchedCount: number;
  wagersGhosted: number;
};

function emptyCounters(): UserCounters {
  return {
    winsCount: 0,
    lossesCount: 0,
    totalWonCents: 0,
    totalLostCents: 0,
    paidUpCount: 0,
    welchedCount: 0,
    wagersGhosted: 0,
  };
}

function makeFakeTx(wager: WagerRow) {
  const users = new Map<string, UserCounters>();
  const payouts: { wagerId: string; fromUserId: string; toUserId: string; amountCents: number }[] = [];

  const getOrCreateUser = (id: string) => {
    if (!users.has(id)) users.set(id, emptyCounters());
    return users.get(id)!;
  };

  // Pre-populate users so we can read their final state.
  for (const b of wager.bets) getOrCreateUser(b.userId);

  const tx = {
    wager: {
      findUnique: async (args: { where: { id: string }; include?: unknown }) => {
        if (args.where.id !== wager.id) return null;
        return wager;
      },
      update: async (args: { where: { id: string }; data: Partial<WagerRow> }) => {
        if (args.where.id !== wager.id) return;
        Object.assign(wager, args.data);
      },
    },
    payout: {
      createMany: async (args: { data: typeof payouts }) => {
        payouts.push(...args.data);
      },
    },
    user: {
      update: async (args: {
        where: { id: string };
        data: {
          winsCount?: { increment: number };
          lossesCount?: { increment: number };
          totalWonCents?: { increment: number };
          totalLostCents?: { increment: number };
        };
      }) => {
        const u = getOrCreateUser(args.where.id);
        if (args.data.winsCount?.increment) u.winsCount += args.data.winsCount.increment;
        if (args.data.lossesCount?.increment) u.lossesCount += args.data.lossesCount.increment;
        if (args.data.totalWonCents?.increment) u.totalWonCents += args.data.totalWonCents.increment;
        if (args.data.totalLostCents?.increment) u.totalLostCents += args.data.totalLostCents.increment;
      },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { tx: tx as any, users, payouts, wager };
}

// ====================================================================
// PRD §2 rain wager end-to-end through resolveWagerInTx
// ====================================================================
describe("resolveWagerInTx — PRD §2 rain wager", () => {
  function setup() {
    const wager: WagerRow = {
      id: "w1",
      status: "AWAITING_RESOLUTION",
      outcomes: [{ id: "yes" }, { id: "no" }],
      bets: [
        { userId: "A", outcomeId: "yes", amountCents: 1000 },
        { userId: "B", outcomeId: "yes", amountCents: 2000 },
        { userId: "C", outcomeId: "no", amountCents: 3000 },
        { userId: "D", outcomeId: "no", amountCents: 4000 },
      ],
    };
    return makeFakeTx(wager);
  }

  it("sets wager to RESOLVED with winningOutcomeId + resolvedAt", async () => {
    const f = setup();
    await resolveWagerInTx(f.tx, { wagerId: "w1", winningOutcomeId: "yes" });
    expect(f.wager.status).toBe("RESOLVED");
    expect(f.wager.winningOutcomeId).toBe("yes");
    expect(f.wager.resolvedAt).toBeInstanceOf(Date);
  });

  it("creates payouts that balance the losers' losses", async () => {
    const f = setup();
    await resolveWagerInTx(f.tx, { wagerId: "w1", winningOutcomeId: "yes" });
    const sum = f.payouts.reduce((s, p) => s + p.amountCents, 0);
    expect(sum).toBe(7000); // $30 + $40
  });

  it("counts each bettor's W/L by whether they bet on winning outcome", async () => {
    const f = setup();
    await resolveWagerInTx(f.tx, { wagerId: "w1", winningOutcomeId: "yes" });
    expect(f.users.get("A")!.winsCount).toBe(1);
    expect(f.users.get("A")!.lossesCount).toBe(0);
    expect(f.users.get("B")!.winsCount).toBe(1);
    expect(f.users.get("B")!.lossesCount).toBe(0);
    expect(f.users.get("C")!.winsCount).toBe(0);
    expect(f.users.get("C")!.lossesCount).toBe(1);
    expect(f.users.get("D")!.winsCount).toBe(0);
    expect(f.users.get("D")!.lossesCount).toBe(1);
  });

  it("totalWonCents and totalLostCents match the math library's nets", async () => {
    const f = setup();
    await resolveWagerInTx(f.tx, { wagerId: "w1", winningOutcomeId: "yes" });
    // A net +$23.33, B net +$46.67, C -$30, D -$40
    expect(f.users.get("A")!.totalWonCents).toBe(2333);
    expect(f.users.get("B")!.totalWonCents).toBe(4667);
    expect(f.users.get("C")!.totalLostCents).toBe(3000);
    expect(f.users.get("D")!.totalLostCents).toBe(4000);
    // Sum of won = sum of lost (zero-sum)
    const totalWon =
      [...f.users.values()].reduce((s, u) => s + u.totalWonCents, 0);
    const totalLost =
      [...f.users.values()].reduce((s, u) => s + u.totalLostCents, 0);
    expect(totalWon).toBe(totalLost);
  });
});

// ====================================================================
// Edge cases
// ====================================================================
describe("resolveWagerInTx — edge cases", () => {
  it("refuses to resolve from OPEN status", async () => {
    const f = makeFakeTx({
      id: "w2",
      status: "OPEN",
      outcomes: [{ id: "a" }, { id: "b" }],
      bets: [{ userId: "u1", outcomeId: "a", amountCents: 1000 }],
    });
    await expect(
      resolveWagerInTx(f.tx, { wagerId: "w2", winningOutcomeId: "a" }),
    ).rejects.toThrow(/Cannot resolve/i);
  });

  it("refuses unknown outcome", async () => {
    const f = makeFakeTx({
      id: "w3",
      status: "AWAITING_RESOLUTION",
      outcomes: [{ id: "a" }],
      bets: [{ userId: "u1", outcomeId: "a", amountCents: 1000 }],
    });
    await expect(
      resolveWagerInTx(f.tx, { wagerId: "w3", winningOutcomeId: "z" }),
    ).rejects.toThrow(/doesn't belong/i);
  });

  it("auto-voids when nobody bet on the winning outcome", async () => {
    const f = makeFakeTx({
      id: "w4",
      status: "AWAITING_RESOLUTION",
      outcomes: [{ id: "yes" }, { id: "no" }],
      bets: [
        { userId: "u1", outcomeId: "no", amountCents: 1000 },
        { userId: "u2", outcomeId: "no", amountCents: 2000 },
      ],
    });
    const result = await resolveWagerInTx(f.tx, { wagerId: "w4", winningOutcomeId: "yes" });
    expect(result.status).toBe("VOID");
    expect(f.wager.status).toBe("VOID");
    expect(f.payouts).toEqual([]);
    expect(f.wager.resolutionNote).toMatch(/auto-voided/i);
  });

  it("single-bettor-self-win is W with no payouts", async () => {
    const f = makeFakeTx({
      id: "w5",
      status: "AWAITING_RESOLUTION",
      outcomes: [{ id: "a" }, { id: "b" }],
      bets: [{ userId: "solo", outcomeId: "a", amountCents: 1000 }],
    });
    await resolveWagerInTx(f.tx, { wagerId: "w5", winningOutcomeId: "a" });
    expect(f.payouts).toEqual([]);
    expect(f.users.get("solo")!.winsCount).toBe(1);
    expect(f.users.get("solo")!.lossesCount).toBe(0);
    expect(f.users.get("solo")!.totalWonCents).toBe(0);
  });

  it("hedger (bet both sides) counts as W and nets correctly", async () => {
    const f = makeFakeTx({
      id: "w6",
      status: "AWAITING_RESOLUTION",
      outcomes: [{ id: "yes" }, { id: "no" }],
      bets: [
        { userId: "hedger", outcomeId: "yes", amountCents: 1000 },
        { userId: "hedger", outcomeId: "no", amountCents: 1000 },
        { userId: "winner", outcomeId: "yes", amountCents: 1000 },
        { userId: "loser", outcomeId: "no", amountCents: 1000 },
      ],
    });
    await resolveWagerInTx(f.tx, { wagerId: "w6", winningOutcomeId: "yes" });
    // hedger: bet on yes → win. Net = 0 (got back their $20).
    expect(f.users.get("hedger")!.winsCount).toBe(1);
    expect(f.users.get("hedger")!.totalWonCents).toBe(0);
    expect(f.users.get("hedger")!.totalLostCents).toBe(0);
    // winner: net +$10
    expect(f.users.get("winner")!.winsCount).toBe(1);
    expect(f.users.get("winner")!.totalWonCents).toBe(1000);
    // loser: net -$10
    expect(f.users.get("loser")!.lossesCount).toBe(1);
    expect(f.users.get("loser")!.totalLostCents).toBe(1000);
    // One payout: loser → winner $10
    expect(f.payouts).toHaveLength(1);
    expect(f.payouts[0]).toMatchObject({
      fromUserId: "loser",
      toUserId: "winner",
      amountCents: 1000,
    });
  });
});
