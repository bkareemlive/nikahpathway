import { NextResponse } from "next/server";
import {
  appStoreConfigured,
  decodeJwsPayload,
  resolveEntitlement,
  type AppStoreTransaction,
} from "@/lib/app-store";
import {
  grantAppStorePlan,
  revokeAppStorePlan,
  findProfileIdForAppStoreTransaction,
} from "@/lib/app-store-grant";
import { APP_STORE_BUNDLE_ID } from "@/data/app-store-products";

// App Store Server Notifications V2:
// https://developer.apple.com/documentation/appstoreservernotifications
//
// This endpoint is public, so the notification itself is never trusted. It
// only tells us WHICH transaction changed; the real state (active, lapsed,
// refunded) is always re-fetched from Apple's authenticated API before
// anything is granted or revoked. A forged request can therefore do nothing
// beyond making us re-read Apple's own answer.

type NotificationPayload = {
  notificationType?: string;
  subtype?: string;
  data?: { bundleId?: string; signedTransactionInfo?: string };
};

export async function POST(req: Request) {
  if (!appStoreConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  let signedPayload: string;
  try {
    const body = (await req.json()) as { signedPayload?: string };
    if (!body.signedPayload) throw new Error("missing signedPayload");
    signedPayload = body.signedPayload;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  let notification: NotificationPayload;
  let hinted: AppStoreTransaction | null = null;
  try {
    notification = decodeJwsPayload<NotificationPayload>(signedPayload);
    const signedTx = notification.data?.signedTransactionInfo;
    if (signedTx) hinted = decodeJwsPayload<AppStoreTransaction>(signedTx);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  // TEST notifications and anything for another app: nothing to do.
  if (!hinted || notification.data?.bundleId !== APP_STORE_BUNDLE_ID) {
    return NextResponse.json({ ok: true });
  }

  try {
    const userId = await findProfileIdForAppStoreTransaction(
      hinted.appAccountToken,
      hinted.originalTransactionId,
    );
    // Not matched to a member yet (the app hasn't reported this purchase).
    // The in-app verification or Restore will grant it when it does.
    if (!userId) return NextResponse.json({ ok: true });

    const { transaction, plan, entitled } = await resolveEntitlement(hinted.transactionId);
    if (entitled) {
      await grantAppStorePlan(userId, plan, transaction.originalTransactionId);
    } else {
      await revokeAppStorePlan(userId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    // A non-2xx makes Apple retry the notification later.
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
