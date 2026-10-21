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

/** Grants full_access or lifetime from a verified Google Play purchase.
 * Mirrors the Stripe webhook's "Lifetime never drops" guard: a Play
 * subscription never downgrades someone who already has Lifetime, however
 * they got it. */
export async function grantGooglePlayPlan(
  userId: string,
  plan: "full_access" | "lifetime",
  purchaseToken: string,
): Promise<void> {
  const current = await profileStateFor(userId);
  if (current?.plan === "lifetime") {
    // Already at or above this grant; just keep the token on record.
    await createAdminClient()
      .from("profiles")
      .update({ google_play_purchase_token: purchaseToken })
      .eq("id", userId);
    return;
  }

  const patch: Record<string, unknown> = {
    plan,
    plan_since: new Date().toISOString(),
    billing_source: "google_play",
    google_play_purchase_token: purchaseToken,
  };
  if (plan === "lifetime") {
    Object.assign(patch, CLEAR_REQUEST_CYCLE);
  } else if (!current?.req_anchor) {
    Object.assign(patch, { req_anchor: new Date().toISOString(), req_cycle: 0, req_carry: 0 });
  }

  await createAdminClient().from("profiles").update(patch).eq("id", userId);
}

/** Reverts to free when a Google Play subscription lapses (expired,
 * revoked, on hold with no grace left) or a one-time purchase is refunded.
 * Only acts when this profile's plan is actually sourced from Google Play
 * right now, so a Play cancellation can never wipe out a Stripe-granted
 * plan (or a Lifetime bought either way). */
export async function revokeGooglePlayPlan(userId: string): Promise<void> {
  const current = await profileStateFor(userId);
  if (!current) return;
  if (current.billing_source !== "google_play") return;
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

/** Finds the profile a Play Developer API purchase/notification belongs to.
 * Prefers the obfuscated account id set at purchase time (set to our own
 * user id, so this is a direct, durable match); falls back to the stored
 * purchase token for renewal events where the token is unchanged. */
export async function findProfileIdForGooglePlayPurchase(
  obfuscatedAccountId: string | null,
  purchaseToken: string,
): Promise<string | null> {
  const admin = createAdminClient();
  if (obfuscatedAccountId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("id", obfuscatedAccountId)
      .maybeSingle<{ id: string }>();
    if (data) return data.id;
  }
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("google_play_purchase_token", purchaseToken)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}
