// Google Play product/base-plan ids. These are configured by hand in Play
// Console (Monetize > Products) and must match exactly, including case.
//
// Play base-plan prices can't be swapped at runtime the way Stripe price ids
// can (see resolvePrice in src/lib/stripe.ts), so the promo/regular price
// split that exists there is mirrored here as separate base plans / products
// instead of a single one with a dynamic price.

export const GOOGLE_PLAY_PACKAGE_NAME = "com.nikahpathway.app";

/** The subscription product id backing Full Access (monthly and 6-month are
 * base plans within this one product). */
export const GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID = "full_access";

export type GooglePlayCycle = "monthly" | "sixMonth";

/** Base plan id to purchase/validate against, mirroring resolvePrice's
 * promo/regular split for the same cycle. */
export function googlePlayBasePlanId(cycle: GooglePlayCycle, promoActive: boolean): string {
  const base = cycle === "sixMonth" ? "six-month" : "monthly";
  return promoActive ? `${base}-promo` : base;
}

/** Lifetime is a one-time (managed) product. Play one-time products carry a
 * single price each, so promo/regular are two separate product ids rather
 * than one product with two base plans. */
export function googlePlayLifetimeProductId(promoActive: boolean): string {
  return promoActive ? "lifetime_access_promo" : "lifetime_access";
}

/** Every base-plan id that could ever be active, used to validate an
 * incoming purchase's basePlanId against something we actually sell. */
export const GOOGLE_PLAY_BASE_PLAN_IDS = [
  "monthly",
  "monthly-promo",
  "six-month",
  "six-month-promo",
] as const;

/** Every lifetime product id that could ever be active. */
export const GOOGLE_PLAY_LIFETIME_PRODUCT_IDS = ["lifetime_access", "lifetime_access_promo"] as const;
