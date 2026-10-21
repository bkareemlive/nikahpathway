# Google Play Billing setup

Why this exists: Google Play's Payments policy names "dating" subscriptions
specifically as a type that must use Google Play's own billing system inside
the app — Stripe checkout can no longer be reachable from inside the Android
app. The web site is unaffected and keeps using Stripe. This document is the
checklist of things only you can do (Play Console and Google Cloud Console
access), to make the code that's already written actually work.

## 1. Create the products in Play Console

**Monetize > Products > Subscriptions** — create one subscription product:

- Product ID: `full_access` (must match exactly — this is hardcoded in
  `src/data/google-play-products.ts`)
- Name: "Full Access"
- Add four **base plans** under it, matching the Stripe prices in
  `src/data/pricing.ts`:

  | Base plan ID | Billing period | Price |
  | --- | --- | --- |
  | `monthly` | 1 month | $24.99 |
  | `monthly-promo` | 1 month | $14.99 |
  | `six-month` | 6 months | $99.99 |
  | `six-month-promo` | 6 months | $90.00 |

  The app picks `*-promo` while `promo.active` is `true` in
  `src/data/pricing.ts`, same as the Stripe side. When the promo ends, either
  deactivate the `-promo` base plans in Play Console or just leave them —
  the app will stop requesting them once `promo.active` is set to `false`
  and redeployed.

**Monetize > Products > In-app products** — create two one-time (managed)
products for Lifetime, since a one-time product can't have multiple prices
the way a subscription's base plans can:

| Product ID | Price |
| --- | --- |
| `lifetime_access` | $229.99 |
| `lifetime_access_promo` | $149.99 |

Activate all of these once created — a draft product can't be purchased.

## 2. Create a service account for the backend

The server (`src/lib/google-play.ts`) needs to call the Android Publisher
API to verify purchases and send renewal/cancellation updates back here.

1. In **Google Cloud Console** (the same Google Cloud project linked to this
   Play Console app — Play Console shows which one under **Setup > API
   access**), go to **IAM & Admin > Service Accounts > Create service
   account**. Any name is fine, e.g. `nikahpathway-play-billing`.
2. Create a JSON key for it (**Keys > Add key > Create new key > JSON**) and
   download it.
3. Back in **Play Console > Setup > API access**, find this service account
   under "Service accounts" and click **Grant access**. Give it:
   - **Financial data** — View financial data (needed to read purchase/
     subscription state)
   - **Orders and subscriptions** — Manage orders and subscriptions (needed
     to acknowledge purchases)
4. Paste the downloaded JSON file's full contents as one line into the
   `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` env var (see `.env.example`). This is
   a secret — set it in Vercel with `vercel env add ... --sensitive`, piping
   the value in rather than passing it inline.

## 3. Real-time Developer Notifications (renewals, cancellations, refunds)

This is what keeps a member's plan in sync after the first purchase —
renewals, voluntary cancellations, billing-issue holds, refunds.

1. In **Google Cloud Console**, enable the **Cloud Pub/Sub API** if it isn't
   already, then **Pub/Sub > Topics > Create topic** — any name, e.g.
   `play-billing-notifications`.
2. **Pub/Sub > Topics > (your topic) > Permissions > Add principal**: grant
   `google-play-developer-notifications@system.gserviceaccount.com` the
   **Pub/Sub Publisher** role — this is Google's own system account that
   publishes Play billing events, not something you create.
3. Create a **push subscription** on that topic pointing at
   `https://nikahpathway.com/api/google-play/notifications`, with these
   settings (under "Authentication"):
   - Enable authentication
   - Service account: the same one from step 2 above (or a dedicated one —
     either way, note its email)
   - Audience: `https://nikahpathway.com/api/google-play/notifications`
     (must exactly match `GOOGLE_PLAY_RTDN_AUDIENCE`)
4. Set the env vars:
   - `GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL` = the service account email
     from step 3
   - `GOOGLE_PLAY_RTDN_AUDIENCE` = `https://nikahpathway.com/api/google-play/notifications`
5. Back in **Play Console > Monetization setup**, set "Real-time
   notifications" to the Pub/Sub topic from step 1.

## 4. Testing before this goes live

Real purchases cost real money, same caution as the Stripe side. Play
Console has a built-in way to test without charges:

1. **Play Console > Setup > License testing**: add your own Google account's
   email as a license tester.
2. Build and install the app via an **internal testing** release track (not
   production) — license testers see "test card, always approves" at
   checkout instead of a real payment screen, for every product above.
3. Walk through: free account hits the request limit → Membership page →
   "Choose Full Access" → native Play purchase sheet → back in the app,
   full_access unlocks. Then try Lifetime the same way. Then try "Restore
   purchases" after reinstalling the app.
4. Once this looks right, promote the release to production the normal way.

## What the code already does (no further setup needed)

- `android/app/src/main/java/com/nikahpathway/app/billing/GooglePlayBillingPlugin.java` —
  native Capacitor plugin wrapping the Play Billing Library.
- `src/lib/actions/google-play-billing.ts` — verifies a purchase against the
  Android Publisher API (never trusts the client's own claim), acknowledges
  it, and grants the plan.
- `src/app/api/google-play/notifications/route.ts` — the RTDN webhook for
  renewals/cancellations/refunds, with its own acknowledgement backstop in
  case the client-side round-trip above never completes.
- `src/lib/native-app.ts`'s `isAndroidApp()` — the Android shell identifies
  itself via `capacitor.config.ts`'s `appendUserAgent`, so the server can
  route it to native Play Billing instead of Stripe (see
  `src/lib/actions/billing.ts` and `src/components/PricingPlans.tsx`).
- `profiles.billing_source` and `profiles.google_play_purchase_token`
  (migration `20261021000001_google_play_billing.sql`) — track which system
  granted a member's plan, so a Google Play cancellation can never revoke a
  plan actually granted by Stripe, or vice versa, and a Lifetime purchase
  (from either system) is never downgraded by the other's events.
