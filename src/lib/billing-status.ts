import "server-only";

import { getStripe, stripeConfigured } from "@/lib/stripe";
import { summarizeSubscription, type SubscriptionSummary } from "@/lib/subscription-summary";

/** Never throws: the Account page still renders if Stripe is unreachable. */
export async function getSubscriptionSummary(
  customerId: string,
): Promise<SubscriptionSummary | null> {
  if (!stripeConfigured()) return null;
  try {
    const subs = await getStripe().subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 5,
    });
    return summarizeSubscription(subs.data);
  } catch {
    return null;
  }
}
