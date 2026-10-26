"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppStoreBilling } from "@/lib/capacitor-billing";
import { verifyAppStorePurchase } from "@/lib/actions/app-store-billing";
import { appStoreProductId, type AppStoreCycle } from "@/data/app-store-products";

const primaryBtn =
  "flex h-11 w-full items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60";

export function AppStoreCheckoutButton({
  plan,
  cycle,
  label,
  userId,
}: {
  plan: "full_access" | "lifetime";
  cycle: AppStoreCycle;
  label: string;
  userId: string;
}) {
  const productId = appStoreProductId(plan, cycle);
  const [price, setPrice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    AppStoreBilling.getProducts({ productIds: [productId] })
      .then(({ products }) => {
        if (cancelled) return;
        setPrice(products[0]?.displayPrice ?? null);
        if (products.length === 0) {
          setDetail(`App Store returned no product for ${productId}.`);
        }
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPrice(null);
        const message =
          err && typeof err === "object" && "message" in err ? String(err.message) : String(err);
        setDetail(message);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function handleClick() {
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const result = await AppStoreBilling.purchase({ productId, appAccountToken: userId });
      if (result.status === "cancelled") {
        setWorking(false);
        return;
      }
      if (result.status === "pending" || !result.transactionId) {
        setNotice("Your purchase is waiting for approval. It will unlock automatically once approved.");
        setWorking(false);
        return;
      }
      const verified = await verifyAppStorePurchase({ transactionId: result.transactionId });
      if (!verified.ok) {
        setError(verified.error);
        setWorking(false);
        return;
      }
      router.push("/dashboard?upgraded=1");
    } catch {
      setError("Something went wrong starting the purchase. Please try again.");
      setWorking(false);
    }
  }

  const caption =
    plan === "lifetime"
      ? price && `${price} one-time purchase`
      : price && `${price} ${cycle === "monthly" ? "per month" : "every 6 months"}, renews automatically`;

  return (
    <div className="w-full">
      <button type="button" onClick={handleClick} disabled={working || price === null} className={primaryBtn}>
        {working ? "Working…" : label}
      </button>
      {caption && <p className="mt-2 text-center text-xs text-muted">{caption}</p>}
      {loaded && price === null && (
        <p className="mt-2 text-center text-xs text-muted">
          This plan isn&apos;t available right now.
          {detail && <span className="mt-1 block break-words opacity-70">{detail}</span>}
        </p>
      )}
      {notice && <p className="mt-2 text-xs text-muted">{notice}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/** Required by App Store Review Guideline 3.1.1: purchases must be
 * restorable. Re-checks every entitlement this Apple ID holds and runs each
 * through the same server verification as a fresh purchase. */
export function RestoreAppStorePurchasesLink() {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleRestore() {
    setWorking(true);
    setMessage(null);
    try {
      const { transactionIds } = await AppStoreBilling.restore();
      if (transactionIds.length === 0) {
        setMessage("No previous purchases found on this Apple ID.");
        setWorking(false);
        return;
      }
      let restored = false;
      for (const transactionId of transactionIds) {
        const result = await verifyAppStorePurchase({ transactionId });
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

/** Auto-renewal disclosure Apple requires next to a subscription offer. */
export function AppStoreSubscriptionTerms() {
  return (
    <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-muted">
      Full Access is an auto-renewing subscription (monthly or every 6 months).
      Payment is charged to your Apple ID at confirmation of purchase. It
      renews automatically unless cancelled at least 24 hours before the end of
      the current period, and your account is charged for renewal within 24
      hours before the period ends. Manage or cancel any time in your Apple ID
      Settings. Lifetime is a one-time purchase with no renewal. See our{" "}
      <Link href="/terms" className="text-primary hover:underline">
        Terms of Use
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="text-primary hover:underline">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
