"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getStripe,
  stripeConfigured,
  resolvePrice,
  type CheckoutPlan,
  type CheckoutCycle,
} from "@/lib/stripe";
import { promo } from "@/data/pricing";

async function origin() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function startCheckout(formData: FormData): Promise<void> {
  const plan = formData.get("plan");
  const cycle = (formData.get("cycle") as string) === "sixMonth" ? "sixMonth" : "monthly";
  if (plan !== "full_access" && plan !== "lifetime") {
    redirect("/membership?error=bad_plan");
  }

  if (!stripeConfigured()) redirect("/membership?error=payments_unavailable");

  const priced = resolvePrice(
    plan as CheckoutPlan,
    cycle as CheckoutCycle,
    promo.active,
  );
  if (!priced) redirect("/membership?error=price_missing");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/membership");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  const stripe = getStripe();
  let customerId = profile?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const base = await origin();
  const session = await stripe.checkout.sessions.create({
    mode: priced.mode,
    customer: customerId,
    line_items: [{ price: priced.priceId, quantity: 1 }],
    client_reference_id: user.id,
    allow_promotion_codes: true,
    metadata: { user_id: user.id, plan },
    ...(priced.mode === "subscription"
      ? { subscription_data: { metadata: { user_id: user.id, plan } } }
      : {}),
    success_url: `${base}/dashboard?upgraded=1`,
    cancel_url: `${base}/membership?canceled=1`,
  });

  if (!session.url) redirect("/membership?error=checkout_failed");
  redirect(session.url);
}

export async function openBillingPortal(formData?: FormData): Promise<void> {
  const returnTo = formData?.get("return_to") === "/account" ? "/account" : "/membership";
  if (!stripeConfigured()) redirect("/membership?error=payments_unavailable");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  if (!profile?.stripe_customer_id) redirect("/membership?error=no_customer");

  const stripe = getStripe();
  const base = await origin();
  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${base}${returnTo}`,
  });
  redirect(portal.url);
}
