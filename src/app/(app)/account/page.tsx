import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  EmailForm,
  PasswordForm,
  CloseAccountForm,
} from "@/components/account/AccountForms";
import { ReportBlockMenu } from "@/components/app/ReportBlockMenu";
import { openBillingPortal } from "@/lib/actions/billing";
import { getSubscriptionSummary } from "@/lib/billing-status";
import { planLabel } from "@/lib/plan";
import { formatLongDate } from "@/lib/subscription-summary";

type BlockedProfile = {
  id: string;
  alias: string | null;
  public_ref: string | null;
};

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("plan, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle<{ plan: string; stripe_customer_id: string | null }>();
  const plan = me?.plan ?? "free";
  const customerId = me?.stripe_customer_id ?? null;
  const summary =
    plan === "full_access" && customerId ? await getSubscriptionSummary(customerId) : null;

  const { data: blockRows } = await supabase
    .from("blocks")
    .select("blocked_id, created_at")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false })
    .returns<{ blocked_id: string; created_at: string }[]>();

  const blockedIds = (blockRows ?? []).map((b) => b.blocked_id);
  let blockedProfiles: BlockedProfile[] = [];
  if (blockedIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, alias, public_ref")
      .in("id", blockedIds)
      .returns<BlockedProfile[]>();
    const byId = new Map((data ?? []).map((p) => [p.id, p]));
    blockedProfiles = blockedIds
      .map((id) => byId.get(id))
      .filter((p): p is BlockedProfile => Boolean(p));
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Account</h1>
      <p className="mt-1 text-sm text-muted">
        Sign-in details for your account.{" "}
        <Link href="/profile" className="font-medium text-primary hover:underline">
          Edit your public profile
        </Link>{" "}
        instead?
      </p>

      <div className="mt-8 grid max-w-xl gap-6">
        <EmailForm current={user.email ?? ""} />
        <PasswordForm />

        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Membership</h2>
          <p className="mt-1 text-sm text-muted">
            You are on the{" "}
            <strong className="font-semibold text-ink">{planLabel(plan)}</strong> plan.
          </p>
          {summary && (
            <p className="mt-2 text-sm text-body">
              {summary.status === "ends"
                ? `Your plan ends on ${formatLongDate(summary.on)}. You keep full access until then.`
                : `Your plan renews on ${formatLongDate(summary.on)}.`}
            </p>
          )}
          {plan === "lifetime" && (
            <p className="mt-2 text-sm text-body">
              Lifetime membership: no renewals and no further payments.
            </p>
          )}
          {plan === "full_access" && customerId && (
            <form action={openBillingPortal} className="mt-4">
              <input type="hidden" name="return_to" value="/account" />
              <button
                type="submit"
                className="h-10 rounded-md border border-line bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-primary"
              >
                Manage billing
              </button>
              <p className="mt-2 text-xs text-muted">
                Update your card, download invoices, or cancel. Cancelling takes
                effect at the end of the current billing period.
              </p>
            </form>
          )}
          {plan === "free" && (
            <Link
              href="/membership"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              See plans
            </Link>
          )}
        </section>

        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Blocked members
          </h2>
          <p className="mt-1 text-sm text-muted">
            You won&apos;t see each other anywhere on NikahPathway, and neither of
            you can send contact.
          </p>
          {blockedProfiles.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              You haven&apos;t blocked anyone.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {blockedProfiles.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <span className="text-sm text-ink">
                    {p.alias ? `${p.alias} · ${p.public_ref}` : p.public_ref}
                  </span>
                  <ReportBlockMenu targetId={p.id} blocked />
                </li>
              ))}
            </ul>
          )}
        </section>

        <CloseAccountForm />
      </div>
    </div>
  );
}
