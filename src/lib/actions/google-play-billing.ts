"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getSubscriptionPurchase,
  getProductPurchase,
  acknowledgeSubscription,
  acknowledgeProductPurchase,
  isSubscriptionEntitled,
  isProductPurchaseEntitled,
  subscriptionObfuscatedAccountId,
  productObfuscatedAccountId,
  subscriptionProductId,
  googlePlayConfigured,
} from "@/lib/google-play";
import { grantGooglePlayPlan } from "@/lib/google-play-grant";
import {
  GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID,
  GOOGLE_PLAY_LIFETIME_PRODUCT_IDS,
} from "@/data/google-play-products";

export type VerifyGooglePlayPurchaseResult =
  | { ok: true; plan: "full_access" | "lifetime" }
  | { ok: false; error: string };

/** Called right after the native purchase flow resolves. Verifies the
 * purchase token against the Android Publisher API (never trusts the
 * client's own claim), acknowledges it, and grants the plan. Real-time
 * Developer Notifications (src/app/api/google-play/notifications) cover
 * renewals/cancellations after this first grant. */
export async function verifyGooglePlayPurchase(input: {
  kind: "subscription" | "onetime";
  productId: string;
  purchaseToken: string;
}): Promise<VerifyGooglePlayPurchaseResult> {
  if (!googlePlayConfigured()) return { ok: false, error: "Payments are not set up yet." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  try {
    if (input.kind === "subscription") {
      if (input.productId !== GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID) {
        return { ok: false, error: "Unknown product." };
      }
      const sub = await getSubscriptionPurchase(input.purchaseToken);
      if (subscriptionProductId(sub) !== GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID) {
        return { ok: false, error: "Purchase does not match this product." };
      }
      if (subscriptionObfuscatedAccountId(sub) !== user.id) {
        return { ok: false, error: "This purchase belongs to a different account." };
      }
      if (!isSubscriptionEntitled(sub)) {
        return { ok: false, error: "This purchase is not currently active." };
      }
      try {
        await acknowledgeSubscription(GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID, input.purchaseToken);
      } catch {
        // Already acknowledged (e.g. a retried call) — not an error.
      }
      await grantGooglePlayPlan(user.id, "full_access", input.purchaseToken);
      return { ok: true, plan: "full_access" };
    }

    if (!GOOGLE_PLAY_LIFETIME_PRODUCT_IDS.includes(
      input.productId as (typeof GOOGLE_PLAY_LIFETIME_PRODUCT_IDS)[number],
    )) {
      return { ok: false, error: "Unknown product." };
    }
    const purchase = await getProductPurchase(input.productId, input.purchaseToken);
    if (productObfuscatedAccountId(purchase) !== user.id) {
      return { ok: false, error: "This purchase belongs to a different account." };
    }
    if (!isProductPurchaseEntitled(purchase)) {
      return { ok: false, error: "This purchase is not currently active." };
    }
    try {
      await acknowledgeProductPurchase(input.productId, input.purchaseToken);
    } catch {
      // Already acknowledged — not an error.
    }
    await grantGooglePlayPlan(user.id, "lifetime", input.purchaseToken);
    return { ok: true, plan: "lifetime" };
  } catch (err) {
    return { ok: false, error: `Could not verify purchase: ${(err as Error).message}` };
  }
}
