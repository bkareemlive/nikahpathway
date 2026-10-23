"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GooglePlayBilling,
  GOOGLE_PLAY_USER_CANCELED,
  GOOGLE_PLAY_ITEM_ALREADY_OWNED,
} from "@/lib/capacitor-billing";
import { verifyGooglePlayPurchase } from "@/lib/actions/google-play-billing";
import {
  GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID,
  googlePlayBasePlanId,
  googlePlayLifetimeProductId,
  type GooglePlayCycle,
} from "@/data/google-play-products";

const primaryBtn =
  "flex h-11 w-full items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60";

function errorCodeOf(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err && typeof err.code === "string") {
    return err.code;
  }
  return undefined;
}

export function GooglePlayCheckoutButton({
  plan,
  cycle,
  promoActive,
  label,
  userId,
}: {
  plan: "full_access" | "lifetime";
  cycle: GooglePlayCycle;
  promoActive: boolean;
  label: string;
  userId: string;
}) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setWorking(true);
    setError(null);
    try {
      const productId =
        plan === "lifetime" ? googlePlayLifetimeProductId(promoActive) : GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID;

      const result =
        plan === "lifetime"
          ? await GooglePlayBilling.purchaseOneTime({ productId, obfuscatedAccountId: userId })
          : await GooglePlayBilling.purchaseSubscription({
              productId,
              basePlanId: googlePlayBasePlanId(cycle, promoActive),
              obfuscatedAccountId: userId,
            });

      const verified = await verifyGooglePlayPurchase({
        kind: plan === "lifetime" ? "onetime" : "subscription",
        productId,
        purchaseToken: result.purchaseToken,
      });

      if (!verified.ok) {
        setError(verified.error);
        setWorking(false);
        return;
      }
      router.push("/dashboard?upgraded=1");
    } catch (err) {
      const code = errorCodeOf(err);
      if (code === GOOGLE_PLAY_USER_CANCELED) {
        setWorking(false);
        return;
      }
      if (code === GOOGLE_PLAY_ITEM_ALREADY_OWNED) {
        setError('You already have this plan. Try "Restore purchases" below.');
        setWorking(false);
        return;
      }
      setError("Something went wrong starting the purchase. Please try again.");
      setWorking(false);
    }
  }

  return (
    <div className="w-full">
      <button type="button" onClick={handleClick} disabled={working} className={primaryBtn}>
        {working ? "Working…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/** Replays every active purchase the device knows about through server
 * verification. Covers reinstalls, device switches, and the
 * ITEM_ALREADY_OWNED case the checkout buttons point here to. */
export function RestoreGooglePlayPurchasesLink() {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleRestore() {
    setWorking(true);
    setMessage(null);
    try {
      const { purchases } = await GooglePlayBilling.queryPurchases();
      if (purchases.length === 0) {
        setMessage("No previous purchases found on this device.");
        setWorking(false);
        return;
      }
      let restored = false;
      for (const p of purchases) {
        const kind = p.productId === GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_ID ? "subscription" : "onetime";
        const result = await verifyGooglePlayPurchase({
          kind,
          productId: p.productId,
          purchaseToken: p.purchaseToken,
        });
        if (result.ok) restored = true;
      }
      if (restored) {
        router.push("/dashboard?upgraded=1");
      } else {
        setMessage("Nothing to restore on this account.");
        setWorking(false);
      }
    } catch {
      setMessage("Could not check for previous purchases. Please try again.");
      setWorking(false);
    }
  }

  return (
    <div className="mt-6 text-center">
      <button
        type="button"
        onClick={handleRestore}
        disabled={working}
        className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
      >
        {working ? "Checking…" : "Restore purchases"}
      </button>
      {message && <p className="mt-2 text-xs text-muted">{message}</p>}
    </div>
  );
}
