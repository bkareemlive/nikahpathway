import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type ProfileBillingState = {
  plan: string;
  billing_source: string | null;
  req_anchor: string | null;
};

async function profileStateFor(id: string): Promise<ProfileBillingState | null> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("plan, billing_source, req_anchor")
    .eq("id", id)
    .maybeSingle<ProfileBillingState>();
  return data;
}

const CLEAR_REQUEST_CYCLE = { req_anchor: null, req_cycle: 0, req_carry: 0 };

/** Grants full_access or lifetime from a verified App Store purchase. Safe
 * to call repeatedly (renewal notifications, restores). Like the other
 * payment sources, a subscription never downgrades an existing Lifetime. */
export async function grantAppStorePlan(
  userId: string,
  plan: "full_access" | "lifetime",
  originalTransactionId: string,
): Promise<void> {
  const admin = createAdminClient();
  const current = await profileStateFor(userId);

  if (current?.plan === "lifetime" && plan !== "lifetime") {
    await admin
      .from("profiles")
      .update({ apple_original_transaction_id: originalTransactionId })
      .eq("id", userId);
    return;
  }

  // Already on this plan from the App Store: only refresh the reference,
  // so a renewal doesn't restart the plan or the request cycle.
  if (current?.plan === plan && current.billing_source === "apple") {
    await admin
      .from("profiles")
      .update({ apple_original_transaction_id: originalTransactionId })
      .eq("id", userId);
    return;
  }

  const patch: Record<string, unknown> = {
    plan,
    plan_since: new Date().toISOString(),
    billing_source: "apple",
    apple_original_transaction_id: originalTransactionId,
  };
  if (plan === "lifetime") {
    Object.assign(patch, CLEAR_REQUEST_CYCLE);
  } else if (!current?.req_anchor) {
    Object.assign(patch, { req_anchor: new Date().toISOString(), req_cycle: 0, req_carry: 0 });
  }

  await admin.from("profiles").update(patch).eq("id", userId);
}

/** Reverts to free when an App Store subscription lapses or a purchase is
 * refunded. Only acts when this profile's plan is sourced from the App Store
 * right now, so an Apple event can never wipe a plan granted by Stripe or
 * Google Play. */
export async function revokeAppStorePlan(userId: string): Promise<void> {
  const current = await profileStateFor(userId);
  if (!current) return;
  if (current.billing_source !== "apple") return;
  if (current.plan === "free") return;

  await createAdminClient()
    .from("profiles")
    .update({
      plan: "free",
      plan_since: null,
      billing_source: null,
      ...CLEAR_REQUEST_CYCLE,
    })
    .eq("id", userId);
}

/** Finds the profile an App Store transaction belongs to. Purchases carry
 * our own user id as the appAccountToken (a UUID, which is what Supabase
 * user ids are), so that's a direct match; the stored original transaction
 * id is the fallback. */
export async function findProfileIdForAppStoreTransaction(
  appAccountToken: string | undefined,
  originalTransactionId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  if (appAccountToken) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("id", appAccountToken.toLowerCase())
      .maybeSingle<{ id: string }>();
    if (data) return data.id;
  }
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("apple_original_transaction_id", originalTransactionId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}
