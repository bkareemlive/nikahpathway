import "server-only";

import { google, androidpublisher_v3 } from "googleapis";
import { GOOGLE_PLAY_PACKAGE_NAME } from "@/data/google-play-products";

let _androidPublisher: androidpublisher_v3.Androidpublisher | null = null;

export function googlePlayConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
}

/** Lazily constructed so the app builds/runs without Google Play credentials set. */
function getAndroidPublisher(): androidpublisher_v3.Androidpublisher {
  if (!_androidPublisher) {
    const json = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    if (!json) throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not set");
    const credentials = JSON.parse(json);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
    _androidPublisher = google.androidpublisher({ version: "v3", auth });
  }
  return _androidPublisher;
}

export type SubscriptionPurchase = androidpublisher_v3.Schema$SubscriptionPurchaseV2;
export type ProductPurchase = androidpublisher_v3.Schema$ProductPurchase;

export async function getSubscriptionPurchase(token: string): Promise<SubscriptionPurchase> {
  const res = await getAndroidPublisher().purchases.subscriptionsv2.get({
    packageName: GOOGLE_PLAY_PACKAGE_NAME,
    token,
  });
  return res.data;
}

/** Acknowledges a subscription purchase. Required within 3 days of purchase
 * or Google auto-refunds it. Safe to call on an already-acknowledged
 * purchase: Google returns an error, which callers should swallow. */
export async function acknowledgeSubscription(
  subscriptionProductId: string,
  token: string,
): Promise<void> {
  await getAndroidPublisher().purchases.subscriptions.acknowledge({
    packageName: GOOGLE_PLAY_PACKAGE_NAME,
    subscriptionId: subscriptionProductId,
    token,
    requestBody: {},
  });
}

export async function getProductPurchase(
  productId: string,
  token: string,
): Promise<ProductPurchase> {
  const res = await getAndroidPublisher().purchases.products.get({
    packageName: GOOGLE_PLAY_PACKAGE_NAME,
    productId,
    token,
  });
  return res.data;
}

export async function acknowledgeProductPurchase(productId: string, token: string): Promise<void> {
  await getAndroidPublisher().purchases.products.acknowledge({
    packageName: GOOGLE_PLAY_PACKAGE_NAME,
    productId,
    token,
    requestBody: {},
  });
}

/** States where Google still owes the member access for the period they
 * already paid for, even if auto-renew is off (SUBSCRIPTION_STATE_CANCELED
 * means "won't renew", not "access ended now") or the renewal attempt is
 * being retried (grace period). */
const ENTITLED_SUBSCRIPTION_STATES = new Set([
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_CANCELED",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
]);

export function isSubscriptionEntitled(sub: SubscriptionPurchase): boolean {
  if (!sub.subscriptionState || !ENTITLED_SUBSCRIPTION_STATES.has(sub.subscriptionState)) {
    return false;
  }
  const expiry = sub.lineItems?.[0]?.expiryTime;
  if (!expiry) return false;
  return new Date(expiry).getTime() > Date.now();
}

export function subscriptionObfuscatedAccountId(sub: SubscriptionPurchase): string | null {
  return sub.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null;
}

export function subscriptionProductId(sub: SubscriptionPurchase): string | null {
  return sub.lineItems?.[0]?.productId ?? null;
}

export function subscriptionBasePlanId(sub: SubscriptionPurchase): string | null {
  return sub.lineItems?.[0]?.offerDetails?.basePlanId ?? null;
}

/** Google Play's purchases.products PurchaseState: 0 purchased, 1
 * canceled/refunded, 2 pending. */
export function isProductPurchaseEntitled(purchase: ProductPurchase): boolean {
  return purchase.purchaseState === 0;
}

export function productObfuscatedAccountId(purchase: ProductPurchase): string | null {
  return purchase.obfuscatedExternalAccountId ?? null;
}
