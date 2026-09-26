export const BASE_REQUESTS = 10;

/** Adds calendar months in UTC, clamping to the month end like Stripe billing (Jan 31 + 1 month = Feb 28). */
export function addMonths(anchor: Date, months: number): Date {
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const d = new Date(anchor.getTime());
  d.setUTCDate(1);
  d.setUTCFullYear(y, m, Math.min(anchor.getUTCDate(), lastDay));
  return d;
}

/** Index of the monthly cycle containing `now`; cycle k spans [anchor + k months, anchor + k+1 months). */
export function cycleIndexAt(anchor: Date, now: Date): number {
  let k = Math.max(
    0,
    (now.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
      (now.getUTCMonth() - anchor.getUTCMonth()) -
      1,
  );
  while (addMonths(anchor, k + 1) <= now) k++;
  return k;
}

/** Requests carried into the next cycle. Carry-over is spent first, so only unused requests from this cycle's own allowance move forward. */
export function carryAfter(used: number, carryIn: number, base = BASE_REQUESTS): number {
  return Math.max(0, base - Math.max(0, used - carryIn));
}

export type CycleState = { cycle: number; carry: number };

/**
 * Brings stored state up to `current`. `usedInStoredCycle` is how many requests
 * were sent during the stored cycle. Any cycles skipped in between had no
 * activity, so their full base allowance carried over.
 */
export function advanceCycle(
  stored: CycleState,
  current: number,
  usedInStoredCycle: number,
  base = BASE_REQUESTS,
): CycleState {
  if (current <= stored.cycle) return stored;
  const carry =
    current - stored.cycle === 1
      ? carryAfter(usedInStoredCycle, stored.carry, base)
      : base;
  return { cycle: current, carry };
}
