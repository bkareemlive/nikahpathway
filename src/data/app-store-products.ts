// App Store product ids. These are configured by hand in App Store Connect
// (Monetization > Subscriptions / In-App Purchases) and must match exactly.
//
// Unlike Stripe or Play base plans there is no promo/regular id split: the
// price is whatever App Store Connect says, shown in the app from StoreKit.

export const APP_STORE_BUNDLE_ID = "com.nikahpathway.ios";

export const APP_STORE_SUBSCRIPTION_PRODUCT_IDS = {
  monthly: "full_access_monthly",
  sixMonth: "full_access_six_months",
} as const;

/** One-time (non-consumable) purchase. The underscore between "life" and
 * "time" is deliberate: it is the id the product was created with, and App
 * Store Connect never lets a Product ID be renamed or reused. */
export const APP_STORE_LIFETIME_PRODUCT_ID = "life_time_access";

export type AppStoreCycle = keyof typeof APP_STORE_SUBSCRIPTION_PRODUCT_IDS;

export function appStoreProductId(plan: "full_access" | "lifetime", cycle: AppStoreCycle): string {
  return plan === "lifetime"
    ? APP_STORE_LIFETIME_PRODUCT_ID
    : APP_STORE_SUBSCRIPTION_PRODUCT_IDS[cycle];
}

/** Every product id we sell, used to reject purchases of anything else. */
export const APP_STORE_PRODUCT_IDS: readonly string[] = [
  APP_STORE_SUBSCRIPTION_PRODUCT_IDS.monthly,
  APP_STORE_SUBSCRIPTION_PRODUCT_IDS.sixMonth,
  APP_STORE_LIFETIME_PRODUCT_ID,
];

export function planForAppStoreProduct(productId: string): "full_access" | "lifetime" | null {
  if (productId === APP_STORE_LIFETIME_PRODUCT_ID) return "lifetime";
  if (
    productId === APP_STORE_SUBSCRIPTION_PRODUCT_IDS.monthly ||
    productId === APP_STORE_SUBSCRIPTION_PRODUCT_IDS.sixMonth
  ) {
    return "full_access";
  }
  return null;
}

/** Where members manage or cancel an App Store subscription. */
export const APP_STORE_MANAGE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";
