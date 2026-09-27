import "server-only";

import Stripe from "stripe";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { summarizeSubscription, type SubscriptionSummary } from "@/lib/subscription-summary";

export type BillingLookup = {
  summary: SubscriptionSummary | null;
  /** False only when Stripe has confirmed the stored customer id doesn't exist
   * (e.g. deleted from the Stripe dashboard); true otherwise, including when
   * Stripe couldn't be reached, so a network hiccup never hides the button
   * for a member with a real subscription. */
  customerValid: boolean;
};

/** Never throws: the Account page still renders if Stripe is unreachable. */
export async function getBillingLookup(customerId: string): Promise<BillingLookup> {
  if (!stripeConfigured()) return { summary: null, customerValid: true };
  try {
    const subs = await getStripe().subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 5,
    });
    return { summary: summarizeSubscription(subs.data), customerValid: true };
  } catch (err) {
    const missing =
      err instanceof Stripe.errors.StripeInvalidRequestError && err.code === "resource_missing";
    return { summary: null, customerValid: !missing };
  }
}
