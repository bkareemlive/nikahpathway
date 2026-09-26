export type SubscriptionSummary = { status: "renews" | "ends"; on: Date };

type SubscriptionLike = {
  status: string;
  cancel_at_period_end: boolean;
  cancel_at: number | null;
  items: { data: { current_period_end: number }[] };
};

/** Renewal or end date of the member's live subscription, or null when there is none. */
export function summarizeSubscription(subs: SubscriptionLike[]): SubscriptionSummary | null {
  const sub = subs.find((s) => s.status === "active" || s.status === "trialing");
  if (!sub) return null;
  const periodEnd = sub.items.data[0]?.current_period_end;
  const endsAt = sub.cancel_at ?? (sub.cancel_at_period_end ? periodEnd : null);
  if (endsAt) return { status: "ends", on: new Date(endsAt * 1000) };
  if (periodEnd) return { status: "renews", on: new Date(periodEnd * 1000) };
  return null;
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
