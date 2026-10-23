import { registerPlugin } from "@capacitor/core";

export type GooglePlayPurchaseResult = {
  productId: string;
  purchaseToken: string;
};

export interface GooglePlayBillingPlugin {
  purchaseSubscription(options: {
    productId: string;
    basePlanId: string;
    obfuscatedAccountId: string;
  }): Promise<GooglePlayPurchaseResult>;
  purchaseOneTime(options: {
    productId: string;
    obfuscatedAccountId: string;
  }): Promise<GooglePlayPurchaseResult>;
  queryPurchases(): Promise<{ purchases: GooglePlayPurchaseResult[] }>;
}

/** Only ever called from the Android app shell (see GooglePlayCheckoutButtons,
 * which the membership page renders only when isAndroidApp() is true), so
 * there's no web fallback implementation to register. */
export const GooglePlayBilling = registerPlugin<GooglePlayBillingPlugin>("GooglePlayBilling");

/** Billing Library response codes we handle specially (others become a
 * generic error message). https://developer.android.com/reference/com/android/billingclient/api/BillingClient.BillingResponseCode */
export const GOOGLE_PLAY_USER_CANCELED = "USER_CANCELED";
export const GOOGLE_PLAY_ITEM_ALREADY_OWNED = "ITEM_ALREADY_OWNED";

export type AppStoreProduct = {
  productId: string;
  /** Localized price from StoreKit, e.g. "$14.99". Always show this one: it's
   * what Apple will actually charge in the member's storefront. */
  displayPrice: string;
};

export type AppStorePurchaseResult = {
  status: "success" | "pending" | "cancelled";
  transactionId?: string;
};

export interface AppStoreBillingPlugin {
  getProducts(options: { productIds: string[] }): Promise<{ products: AppStoreProduct[] }>;
  purchase(options: {
    productId: string;
    /** Our Supabase user id (a UUID); Apple stamps it on the transaction so
     * the server can tell who bought it. */
    appAccountToken: string;
  }): Promise<AppStorePurchaseResult>;
  /** Syncs with the App Store, then returns every transaction the member is
   * currently entitled to on this Apple ID. */
  restore(): Promise<{ transactionIds: string[] }>;
}

/** Only ever called from the iOS app shell (see AppStoreCheckoutButtons,
 * which the membership page renders only when isIosApp() is true). The
 * native side lives in ios/App/App/AppStoreBillingPlugin.swift. */
export const AppStoreBilling = registerPlugin<AppStoreBillingPlugin>("AppStoreBilling");
