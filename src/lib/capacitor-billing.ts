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
