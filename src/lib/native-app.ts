import "server-only";

import { headers } from "next/headers";

// The Capacitor iOS shell loads the live site in a WKWebView, whose default
// user agent has no "Safari/" token (Safari and Chrome for iOS both do).
// In-app browsers from other apps are excluded explicitly.
const IOS_DEVICE = /\b(iPhone|iPad|iPod)\b/;
const NOT_THE_SHELL =
  /Safari\/|CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|DuckDuckGo|FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter|LinkedInApp|Snapchat|Pinterest|TikTok/i;

// capacitor.config.ts sets ios.appendUserAgent to this exact string. Builds
// that carry it include the native StoreKit plugin, so they get the In-App
// Purchase membership UI; older builds don't, and keep purchase UI hidden.
const IOS_APP_UA_TOKEN = "NikahPathwayIosApp";

export function isIosAppUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  if (userAgent.includes(IOS_APP_UA_TOKEN)) return true;
  return IOS_DEVICE.test(userAgent) && !NOT_THE_SHELL.test(userAgent);
}

export function iosAppHasPurchases(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent?.includes(IOS_APP_UA_TOKEN));
}

/** True for an iOS app build with the native StoreKit plugin (membership is
 * sold in the app through In-App Purchase). */
export async function isIosAppWithPurchases(): Promise<boolean> {
  return iosAppHasPurchases((await headers()).get("user-agent"));
}

/** True for an iOS app build WITHOUT native billing (the first release):
 * every purchase prompt stays hidden there, since Stripe isn't allowed in
 * the app and there's no In-App Purchase to offer instead. */
export async function isIosAppWithoutPurchases(): Promise<boolean> {
  const ua = (await headers()).get("user-agent");
  return isIosAppUserAgent(ua) && !iosAppHasPurchases(ua);
}

/** True when the request comes from the NikahPathway iOS app. App Store rules
 * (4.8 social login, 3.1.1 in-app purchase) mean sign-in via Google and all
 * purchase UI are hidden there; the website is unchanged. */
export async function isIosApp(): Promise<boolean> {
  return isIosAppUserAgent((await headers()).get("user-agent"));
}

// capacitor.config.ts sets android.appendUserAgent to this exact string, so
// the Android shell's WebView is unambiguously identifiable (unlike iOS,
// which has to be inferred by exclusion — Android WebViews don't need that
// since we control this token directly).
const ANDROID_APP_UA_TOKEN = "NikahPathwayAndroidApp";

export function isAndroidAppUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return userAgent.includes(ANDROID_APP_UA_TOKEN);
}

/** True when the request comes from the NikahPathway Android app. Google
 * Play's Payments policy requires "dating" subscriptions to use Play
 * Billing in-app (Stripe checkout is web-only), so purchase UI there goes
 * through the native Play Billing flow instead of Stripe. */
export async function isAndroidApp(): Promise<boolean> {
  return isAndroidAppUserAgent((await headers()).get("user-agent"));
}
