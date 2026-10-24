# Apple In-App Purchase setup (iOS)

Code is in place; this is everything that has to be configured by hand outside
the repo. Do these in order. Steps 1-2 involve Apple review/processing time, so
start them first.

## 1. Agreements, tax and banking (Account Holder only)

App Store Connect > **Business** (or Agreements, Tax, and Banking):

- Accept the **Paid Applications Agreement**.
- Add the **bank account** and complete the **tax forms**. Until the status
  shows **Active**, in-app purchases can't go live (sandbox testing still works).

## 2. Create the products

App Store Connect > NikahPathway > **Monetization > Subscriptions**:

1. Create a subscription group named **NikahPathway Membership**.
2. Add two auto-renewable subscriptions to it. The **Product ID** must match
   exactly:

   | Product ID | Duration | Suggested price |
   | --- | --- | --- |
   | `full_access_monthly` | 1 month | $14.99 (the current launch price) |
   | `full_access_six_months` | 6 months | $89.99 |

3. For each: fill in the reference name, localized display name/description
   (e.g. "Full Access, monthly"), and a **review screenshot** (a screenshot of
   the Membership screen in the app).

App Store Connect > **Monetization > In-App Purchases**:

4. Create a **Non-Consumable** with Product ID `life_time_access`, price
   **$149.99**, display name "Lifetime", and a review screenshot.

Apple's price points don't include $90.00, so $89.99 is the nearest to the web's
launch price. Keep Apple prices in line with the web plans; Apple lets you change
them later.

All three products must be attached to the app version when you submit it for
review (the version page has an **In-App Purchases and Subscriptions** section).

## 3. API key (lets the server verify purchases)

App Store Connect > **Users and Access > Integrations > In-App Purchase**:

1. Click **Generate In-App Purchase Key** (Account Holder / Admin).
2. Download the `.p8` once (you can't download it again).
3. Copy the **Issuer ID** (top of the page) and the **Key ID**.

Add these to the server environment (e.g. Vercel project settings):

```
APP_STORE_ISSUER_ID=<issuer id>
APP_STORE_KEY_ID=<key id>
APP_STORE_PRIVATE_KEY="<contents of the .p8, with newlines written as \n>"
```

## 4. Notifications URL

App Store Connect > NikahPathway > **App Information > App Store Server
Notifications**:

- **Production Server URL** and **Sandbox Server URL**:
  `https://nikahpathway.com/api/app-store/notifications`
- Version: **Version 2**.

## 5. Database migration

Run `supabase/migrations/20261022000001_app_store_billing.sql` in the Supabase
SQL editor (adds `apple` to `billing_source` and the transaction-id column).

## 6. Testing (no real money)

1. App Store Connect > **Users and Access > Sandbox > Test Accounts**: create a
   sandbox Apple ID.
2. Install the build from **TestFlight** (TestFlight purchases are sandbox).
3. On the iPhone, sign in to the sandbox account when the purchase sheet asks.
4. Buy each product, then check `profiles.plan`, `billing_source = 'apple'` and
   `apple_original_transaction_id`. Sandbox subscriptions renew every few
   minutes, so renewals and expiry can be checked quickly.
5. Delete and reinstall the app, then use **Restore purchases**.

## 7. Submit

Submit the new app version with the three products attached. Mention in the
review notes that purchases use In-App Purchase and give the demo account.
