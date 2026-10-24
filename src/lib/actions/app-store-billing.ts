"use server";

import { createClient } from "@/lib/supabase/server";
import { appStoreConfigured, resolveEntitlement } from "@/lib/app-store";
import { grantAppStorePlan } from "@/lib/app-store-grant";

export type VerifyAppStorePurchaseResult =
  | { ok: true; plan: "full_access" | "lifetime" }
  | { ok: false; error: string };

/** Called right after the native purchase flow resolves (and for each item
 * on Restore). Asks Apple's App Store Server API for the transaction's real
 * state, never trusting the client's own claim, checks it was bought by this
 * member, and grants the plan. App Store Server Notifications
 * (src/app/api/app-store/notifications) cover renewals, lapses and refunds
 * after this first grant. */
export async function verifyAppStorePurchase(input: {
  transactionId: string;
}): Promise<VerifyAppStorePurchaseResult> {
  if (!appStoreConfigured()) return { ok: false, error: "Payments are not set up yet." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  try {
    const { transaction, plan, entitled } = await resolveEntitlement(input.transactionId);
    if (transaction.appAccountToken?.toLowerCase() !== user.id.toLowerCase()) {
      return { ok: false, error: "This purchase belongs to a different account." };
    }
    if (!entitled) {
      return { ok: false, error: "This purchase is not currently active." };
    }
    await grantAppStorePlan(user.id, plan, transaction.originalTransactionId);
    return { ok: true, plan };
  } catch (err) {
    return { ok: false, error: `Could not verify purchase: ${(err as Error).message}` };
  }
}
