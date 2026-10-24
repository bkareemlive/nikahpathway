# Payments (Stripe + Google Play Billing + Apple In-App Purchase)

Plan gating is live and works without Stripe. Checkout stays inert until the
keys below are set — the buttons then start real Stripe Checkout.

The web site uses Stripe. **The Android app uses Google Play Billing** and
**the iOS app uses Apple In-App Purchase** instead — both stores require
subscriptions sold inside an app to use their own billing, so Stripe checkout
is unreachable from inside either app. See the "Google Play Billing" and
"Apple In-App Purchase" sections below.

## Plans

| Plan | Type | Regular | Launch promo |
| --- | --- | --- | --- |
| Full Access — monthly | subscription | $24.99/mo | $14.99/mo |
| Full Access — 6 months | subscription (every 6 mo) | $99.99 | $90 |
| Lifetime | one-time | $229.99 | $149.99 |

Amounts live in `src/data/pricing.ts`. The promo is toggled by `promo.active`
in that file; while active, checkout uses the `*_PROMO` price ids. The promo
has no fixed end date — it's open-ended, available while it lasts.

## What gating enforces (`src/lib/plan.ts`)

| Capability | Free | Full Access | Lifetime |
| --- | --- | --- | --- |
| Interest requests / billing cycle | 0 | 10, plus unused ones carried forward once | unlimited |
| Advanced browse filters + recent-active sort | – | ✓ | ✓ |
| See who viewed you (`/viewed`) | count only | ✓ | ✓ |
| Visibility boost in Browse | – | – | ✓ |

## Setup

1. Create a Stripe account (test mode is fine to start).
2. Put the **secret key** in `.env.local` as `STRIPE_SECRET_KEY` (test: `sk_test_…`).
3. Create the products/prices:
   ```bash
   node scripts/stripe-setup.mjs
   ```
   Paste the six `STRIPE_PRICE_*` lines it prints into `.env.local`.
4. Apply the DB migration (adds `profiles.stripe_customer_id` + two RLS
   policies): run `supabase/apply-2.sql` in the Supabase SQL Editor, or
   `npx supabase db push` if the CLI is linked.
5. Set up the webhook:
   - **Local:** `stripe listen --forward-to localhost:3000/api/stripe/webhook`
     and copy the `whsec_…` it prints into `STRIPE_WEBHOOK_SECRET`.
   - **Production:** add an endpoint at `https://<domain>/api/stripe/webhook`
     for events `checkout.session.completed`,
     `customer.subscription.created/updated/deleted`; copy its signing secret.
6. Restart the dev server. The membership buttons now open Stripe Checkout;
   on success the webhook sets `profiles.plan` / `plan_since`.

## Flow

- `startCheckout` (server action) creates/reuses a Stripe customer, opens a
  Checkout Session (`success_url` → `/dashboard?upgraded=1`), redirects.
- `/api/stripe/webhook` verifies the signature and updates the profile:
  Lifetime → `plan = lifetime`; an active subscription → `plan = full_access`;
  a cancelled/deleted subscription → `plan = free` and the carried-over
  request balance is cleared. Subscription events never change a Lifetime
  member's plan.
- `openBillingPortal` sends subscribers to the Stripe customer portal. It is
  linked from the Account page (with the renewal or end date) and the
  Membership page. Portal cancellation takes effect at the end of the billing
  period, as the Terms say.
- Refunds are **not** handled by the webhook. Follow the routine below.

## Refund routine (7-day money-back guarantee)

The Terms promise a full refund if the member asks within 7 days of their
**first purchase of that plan**. Requests arrive at salam@nikahpathway.com.
Refunding a payment in Stripe does not change the member's access on its own,
so each refund has two parts: the money, and the access.

### 1. Check eligibility
- Find the member in Stripe: **Customers**, search their email. Open the
  payment and note its date.
- Within 7 days of the first purchase of that plan: refund in full.
- After 7 days: not refundable under the Terms (except where the law requires
  it). Any goodwill exception is a team decision; use the same steps below.
- Double-check the email and amount before refunding. Refunds cannot be undone.

### 2a. Full Access (subscription)
1. Stripe: **Customers**, the member, their subscription, **Actions**, **Cancel
   subscription**, choose **Immediately**. This stops future billing.
2. Stripe: **Payments**, open the payment, **Refund**, full amount, reason
   "Requested by customer".
3. Within a minute the webhook sets the member to free and clears their
   request balance. Confirm in the Supabase SQL editor:
   ```sql
   select plan, req_anchor, req_carry from public.profiles
   where id = (select id from auth.users where email = 'MEMBER-EMAIL');
   ```
   Expect `free` and empty values. If not, open Stripe, **Developers**,
   **Webhooks**, the endpoint, and check the recent deliveries for errors.

### 2b. Lifetime (one-time payment)
1. Stripe: **Payments**, open the payment, **Refund**, full amount, reason
   "Requested by customer".
2. Remove their access by hand, because the webhook does not see refunds. In
   the Supabase SQL editor:
   ```sql
   update public.profiles
   set plan = 'free', plan_since = null
   where id = (select id from auth.users where email = 'MEMBER-EMAIL');
   ```
3. Rare case: if the member also has an active Full Access subscription, put
   them back on it instead of free. Use the subscription's current period
   start from Stripe:
   ```sql
   update public.profiles
   set plan = 'full_access', plan_since = now(),
       req_anchor = 'PERIOD-START-ISO-DATE', req_cycle = 0, req_carry = 0
   where id = (select id from auth.users where email = 'MEMBER-EMAIL');
   ```

### 3. Tell the member
Reply from salam@nikahpathway.com: the refund is issued, and it usually reaches
their card in 5 to 10 business days depending on the bank. Mention that their
paid access has ended.

### Not covered
Chargebacks and disputes are handled in Stripe under **Disputes**. Automatic
refund handling (reacting to Stripe's refund events) is possible later; it needs
the webhook endpoint in Stripe to subscribe to `charge.refunded`.

## Google Play Billing (Android app)

Full setup checklist (Play Console products, service account, Real-time
Developer Notifications, testing without real charges):
`store-assets/android/google-play-billing.md`.

- `profiles.billing_source` ('stripe' or 'google_play') and
  `profiles.google_play_purchase_token` track which system granted a
  member's current plan, so one system's events can never revoke a plan the
  other one granted — a Lifetime bought either way is never downgraded.
- `GooglePlayCheckoutButton` (in the Android-only branch of
  `PricingPlans.tsx`) launches the native Play Billing Library purchase
  sheet, then calls `verifyGooglePlayPurchase` (a server action), which
  re-verifies the purchase against the Android Publisher API — never trusts
  the client's own claim — acknowledges it, and grants the plan. This
  mirrors `startCheckout` for Stripe.
- `/api/google-play/notifications` is the Real-time Developer Notifications
  webhook: renewals, cancellations, billing-hold/grace-period states, and
  refunds. It verifies the push request's signed OIDC token (Pub/Sub's
  equivalent of Stripe's webhook signature) before trusting anything in it.
- **Unlike Stripe, Google Play refunds and chargebacks revoke access
  automatically** — Google sends a `voidedPurchaseNotification` that the
  webhook handles the same way as an expiry. There is no manual "remove
  access by hand" step for Google Play refunds the way there is for Stripe's
  (see the refund routine above); only issue the refund itself in Play
  Console's **Order management**.
- A member who installs the app on a new device, or reinstalls it, uses
  "Restore purchases" on the Membership page to re-link an existing active
  purchase without paying again.

## Apple In-App Purchase (iOS app)

Full setup checklist (agreements, products, API key, notifications URL,
sandbox testing): `store-assets/ios/app-store-billing.md`.

- `profiles.billing_source` also takes `'apple'`, and
  `profiles.apple_original_transaction_id` links a member to their App Store
  subscription or purchase. Same rule as the other sources: an Apple event can
  only revoke a plan Apple granted, and Lifetime is never downgraded.
- Products (ids in `src/data/app-store-products.ts`, created by hand in App
  Store Connect): subscription group "NikahPathway Membership" with
  `full_access_monthly` and `full_access_six_month`, plus the non-consumable
  `lifetime_access`. Prices are whatever App Store Connect says; the app shows
  the live StoreKit price.
- `ios/App/App/AppStoreBillingPlugin.swift` (StoreKit 2) runs the purchase and
  stamps our user id on it (`appAccountToken`). `AppStoreCheckoutButton` then
  calls `verifyAppStorePurchase`, which asks Apple's App Store Server API for
  the transaction's real state — never trusting the client — and grants the
  plan.
- `/api/app-store/notifications` is the App Store Server Notifications V2
  endpoint (renewals, expiry, refunds). The payload is never trusted; it only
  names a transaction, and the real state is re-fetched from Apple before
  anything is granted or revoked.
- Apple refunds and revocations remove access automatically through those
  notifications. Issue refunds only through Apple (reportaproblem.apple.com);
  there is no manual step.
- "Restore purchases" on the Membership page is required by App Review and
  re-links an existing purchase to the signed-in account.

## Note for a US 501(c)(3)

Stripe does not remit sales tax/VAT for you. Selling digital memberships
internationally may create tax obligations. Consider Stripe Tax, or a
merchant-of-record (Lemon Squeezy / Paddle), before taking live payments
outside the US.
