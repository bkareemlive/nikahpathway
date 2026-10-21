import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import {
  getSubscriptionPurchase,
  getProductPurchase,
  acknowledgeSubscription,
  acknowledgeProductPurchase,
  isSubscriptionEntitled,
  isProductPurchaseEntitled,
  subscriptionObfuscatedAccountId,
  productObfuscatedAccountId,
} from "@/lib/google-play";
import {
  grantGooglePlayPlan,
  revokeGooglePlayPlan,
  findProfileIdForGooglePlayPurchase,
} from "@/lib/google-play-grant";
import { GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID } from "@/data/google-play-products";

// Google Cloud Pub/Sub's documented shape for a push message.
type PubSubPushBody = {
  message: { data: string; messageId: string; attributes?: Record<string, string> };
  subscription: string;
};

// https://developer.android.com/google/play/billing/rtdn-reference
type DeveloperNotification = {
  packageName: string;
  subscriptionNotification?: { notificationType: number; purchaseToken: string; subscriptionId: string };
  oneTimeProductNotification?: { notificationType: number; purchaseToken: string; sku: string };
  voidedPurchaseNotification?: {
    purchaseToken: string;
    productType: number; // 1 = subscription, 2 = one-time
    refundType: number;
  };
  testNotification?: { version: string };
};

const oauthClient = new OAuth2Client();

async function verifyPushRequest(req: Request): Promise<boolean> {
  const audience = process.env.GOOGLE_PLAY_RTDN_AUDIENCE;
  const expectedEmail = process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL;
  if (!audience || !expectedEmail) return false;

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return false;

  try {
    const ticket = await oauthClient.verifyIdToken({ idToken: token, audience });
    const payload = ticket.getPayload();
    return Boolean(payload?.email_verified && payload.email === expectedEmail);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await verifyPushRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: PubSubPushBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  let notification: DeveloperNotification;
  try {
    notification = JSON.parse(Buffer.from(body.message.data, "base64").toString("utf8"));
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  try {
    if (notification.subscriptionNotification) {
      const { purchaseToken } = notification.subscriptionNotification;
      // Always re-derive truth from the API rather than trusting the
      // notification's own claimed type (mirrors the Stripe webhook, which
      // re-reads canonical state before acting on an event).
      const sub = await getSubscriptionPurchase(purchaseToken);
      const obfuscatedAccountId = subscriptionObfuscatedAccountId(sub);
      const userId = await findProfileIdForGooglePlayPurchase(obfuscatedAccountId, purchaseToken);
      if (userId) {
        if (isSubscriptionEntitled(sub)) {
          await grantGooglePlayPlan(userId, "full_access", purchaseToken);
          // Backstop: normally the client already acknowledged this via
          // verifyGooglePlayPurchase right after the purchase completed.
          // If that round-trip never happened (app closed, network drop),
          // Google auto-refunds an unacknowledged purchase after 3 days —
          // acknowledging here too means that never depends on the client.
          try {
            await acknowledgeSubscription(GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID, purchaseToken);
          } catch {
            // Already acknowledged — expected on the common path.
          }
        } else {
          await revokeGooglePlayPlan(userId);
        }
      }
    } else if (notification.oneTimeProductNotification) {
      // Same backstop as above, for the one-time Lifetime product.
      const { purchaseToken, sku } = notification.oneTimeProductNotification;
      if (notification.oneTimeProductNotification.notificationType === 1 /* ONE_TIME_PRODUCT_PURCHASED */) {
        const purchase = await getProductPurchase(sku, purchaseToken);
        const obfuscatedAccountId = productObfuscatedAccountId(purchase);
        const userId = await findProfileIdForGooglePlayPurchase(obfuscatedAccountId, purchaseToken);
        if (userId && isProductPurchaseEntitled(purchase)) {
          await grantGooglePlayPlan(userId, "lifetime", purchaseToken);
          try {
            await acknowledgeProductPurchase(sku, purchaseToken);
          } catch {
            // Already acknowledged — expected on the common path.
          }
        }
      }
    } else if (notification.voidedPurchaseNotification) {
      // Refund or chargeback on either a subscription or the one-time
      // Lifetime product — revoke if we currently credit this user's plan
      // to Google Play.
      const { purchaseToken } = notification.voidedPurchaseNotification;
      const userId = await findProfileIdForGooglePlayPurchase(null, purchaseToken);
      if (userId) await revokeGooglePlayPlan(userId);
    }
  } catch (err) {
    return NextResponse.json({ error: `handler error: ${(err as Error).message}` }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
