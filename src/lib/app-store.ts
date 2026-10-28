import "server-only";

import { createPrivateKey, sign } from "node:crypto";
import {
  APP_STORE_BUNDLE_ID,
  planForAppStoreProduct,
} from "@/data/app-store-products";

// App Store Server API: https://developer.apple.com/documentation/appstoreserverapi
const PRODUCTION_BASE = "https://api.storekit.itunes.apple.com";
const SANDBOX_BASE = "https://api.storekit-sandbox.itunes.apple.com";

export function appStoreConfigured(): boolean {
  return Boolean(
    process.env.APP_STORE_ISSUER_ID &&
      process.env.APP_STORE_KEY_ID &&
      process.env.APP_STORE_PRIVATE_KEY,
  );
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Short-lived ES256 JWT that authenticates us to the App Store Server API. */
function createApiToken(): string {
  const raw = process.env.APP_STORE_PRIVATE_KEY!;
  // Env files often store the .p8 on one line with literal "\n" sequences.
  const key = createPrivateKey(raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: process.env.APP_STORE_KEY_ID!, typ: "JWT" };
  const payload = {
    iss: process.env.APP_STORE_ISSUER_ID!,
    iat: now,
    exp: now + 5 * 60,
    aud: "appstoreconnect-v1",
    bid: APP_STORE_BUNDLE_ID,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = sign("sha256", Buffer.from(signingInput), {
    key,
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${b64url(signature)}`;
}

/** Production first; a 404 there means the transaction is a sandbox one
 * (TestFlight and App Review purchases are), so retry against sandbox. */
async function apiGet<T>(path: string): Promise<T> {
  const token = createApiToken();
  let lastError = "no response";
  for (const base of [PRODUCTION_BASE, SANDBOX_BASE]) {
    const res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) return (await res.json()) as T;
    lastError = `${res.status} ${await res.text()}`;
    // 404 = transaction exists but not in this environment (try sandbox).
    // 401 = production rejects our key; still try sandbox because TestFlight
    //       transactions only exist in the sandbox environment.
    if (res.status !== 404 && res.status !== 401) break;
  }
  throw new Error(`App Store Server API: ${lastError}`);
}

/** Reads the payload of a JWS without verifying its signature. Only use on
 * data that came straight from Apple over TLS (API responses). Payloads that
 * arrive via our public notification endpoint are never trusted this way:
 * they only tell us which transaction to re-fetch from the API. */
export function decodeJwsPayload<T>(jws: string): T {
  const part = jws.split(".")[1];
  if (!part) throw new Error("Malformed JWS");
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}

export type AppStoreTransaction = {
  transactionId: string;
  originalTransactionId: string;
  bundleId: string;
  productId: string;
  purchaseDate: number;
  expiresDate?: number;
  revocationDate?: number;
  appAccountToken?: string;
  environment?: string;
};

export async function getTransaction(transactionId: string): Promise<AppStoreTransaction> {
  const res = await apiGet<{ signedTransactionInfo: string }>(
    `/inApps/v1/transactions/${encodeURIComponent(transactionId)}`,
  );
  return decodeJwsPayload<AppStoreTransaction>(res.signedTransactionInfo);
}

// https://developer.apple.com/documentation/appstoreserverapi/status
const SUBSCRIPTION_ACTIVE = 1;
const SUBSCRIPTION_BILLING_GRACE_PERIOD = 4;

type SubscriptionStatusesResponse = {
  data?: {
    lastTransactions: {
      status: number;
      originalTransactionId: string;
      signedTransactionInfo: string;
    }[];
  }[];
};

async function subscriptionIsEntitled(tx: AppStoreTransaction): Promise<boolean> {
  const res = await apiGet<SubscriptionStatusesResponse>(
    `/inApps/v1/subscriptions/${encodeURIComponent(tx.transactionId)}`,
  );
  for (const group of res.data ?? []) {
    for (const last of group.lastTransactions) {
      if (last.originalTransactionId !== tx.originalTransactionId) continue;
      return last.status === SUBSCRIPTION_ACTIVE || last.status === SUBSCRIPTION_BILLING_GRACE_PERIOD;
    }
  }
  return false;
}

export type ResolvedEntitlement = {
  transaction: AppStoreTransaction;
  plan: "full_access" | "lifetime";
  /** False when the subscription has lapsed or the purchase was refunded. */
  entitled: boolean;
};

/** Asks Apple for the current truth about a transaction: never trusts what
 * the device or a notification claims. Throws if the transaction is for a
 * different app or a product we don't sell. */
export async function resolveEntitlement(transactionId: string): Promise<ResolvedEntitlement> {
  const transaction = await getTransaction(transactionId);
  if (transaction.bundleId !== APP_STORE_BUNDLE_ID) {
    throw new Error("Transaction belongs to a different app");
  }
  const plan = planForAppStoreProduct(transaction.productId);
  if (!plan) throw new Error("Unknown product");

  if (transaction.revocationDate) return { transaction, plan, entitled: false };
  if (plan === "lifetime") return { transaction, plan, entitled: true };
  return { transaction, plan, entitled: await subscriptionIsEntitled(transaction) };
}
