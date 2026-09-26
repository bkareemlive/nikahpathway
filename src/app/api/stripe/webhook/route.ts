import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const restHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function patchProfile(id: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPA_URL}/rest/v1/profiles?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...restHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`profile update failed (${res.status}): ${await res.text()}`);
  }
}

async function profileStateFor(
  id: string,
): Promise<{ plan: string; req_anchor: string | null }> {
  const r = await fetch(
    `${SUPA_URL}/rest/v1/profiles?id=eq.${id}&select=plan,req_anchor`,
    { headers: restHeaders },
  );
  if (!r.ok) throw new Error(`profile lookup failed (${r.status}): ${await r.text()}`);
  const rows = (await r.json()) as { plan: string; req_anchor: string | null }[];
  return rows[0] ?? { plan: "free", req_anchor: null };
}

const CLEAR_REQUEST_CYCLE = { req_anchor: null, req_cycle: 0, req_carry: 0 };

async function profileIdForCustomer(customer: string): Promise<string | null> {
  const r = await fetch(
    `${SUPA_URL}/rest/v1/profiles?stripe_customer_id=eq.${customer}&select=id`,
    { headers: restHeaders },
  );
  const rows = (await r.json()) as { id: string }[];
  return rows[0]?.id ?? null;
}

function userIdFrom(obj: {
  client_reference_id?: string | null;
  metadata?: Stripe.Metadata | null;
}): string | null {
  return obj.client_reference_id || obj.metadata?.user_id || null;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig ?? "", secret);
  } catch (err) {
    return NextResponse.json(
      { error: `signature check failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId =
          userIdFrom(s) ||
          (typeof s.customer === "string" ? await profileIdForCustomer(s.customer) : null);
        if (!userId) break;

        const patch: Record<string, unknown> = {};
        if (typeof s.customer === "string") patch.stripe_customer_id = s.customer;
        if (s.mode === "payment" && s.payment_status === "paid") {
          patch.plan = "lifetime";
          patch.plan_since = new Date().toISOString();
          Object.assign(patch, CLEAR_REQUEST_CYCLE);
        } else if (s.mode === "subscription") {
          // A Lifetime member never drops to a subscription plan.
          if ((await profileStateFor(userId)).plan !== "lifetime") {
            patch.plan = "full_access";
            patch.plan_since = new Date().toISOString();
          }
        }
        if (Object.keys(patch).length) await patchProfile(userId, patch);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const userId =
          (sub.metadata?.user_id as string | undefined) ||
          (await profileIdForCustomer(customer));
        if (!userId) break;

        const state = await profileStateFor(userId);
        if (state.plan === "lifetime") {
          await patchProfile(userId, { stripe_customer_id: customer });
          break;
        }

        const active = sub.status === "active" || sub.status === "trialing";
        const patch: Record<string, unknown> = {
          stripe_customer_id: customer,
          plan: active ? "full_access" : "free",
          plan_since: active ? new Date().toISOString() : null,
        };
        if (!active) {
          Object.assign(patch, CLEAR_REQUEST_CYCLE);
        } else if (!state.req_anchor) {
          const periodStart = sub.items.data[0]?.current_period_start;
          Object.assign(patch, {
            req_anchor: new Date((periodStart ?? Date.now() / 1000) * 1000).toISOString(),
            req_cycle: 0,
            req_carry: 0,
          });
        }
        await patchProfile(userId, patch);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const userId =
          (sub.metadata?.user_id as string | undefined) ||
          (await profileIdForCustomer(customer));
        if (userId && (await profileStateFor(userId)).plan !== "lifetime") {
          await patchProfile(userId, {
            plan: "free",
            plan_since: null,
            ...CLEAR_REQUEST_CYCLE,
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    return NextResponse.json(
      { error: `handler error: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
