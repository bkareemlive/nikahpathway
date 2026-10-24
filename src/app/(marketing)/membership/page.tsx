import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { SectionHeading } from "@/components/SectionHeading";
import { Faq } from "@/components/Faq";
import { PricingPlans } from "@/components/PricingPlans";
import { planFeatures, pricingFaq } from "@/data/pricing";
import { site } from "@/data/site";
import { createClient } from "@/lib/supabase/server";
import { planLabel } from "@/lib/plan";
import { isIosApp, isIosAppWithPurchases, isAndroidApp } from "@/lib/native-app";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Free to create a profile and browse. Choose Full Access or a one-time Lifetime plan to match, chat and reach a Wali.",
};

const NOTICES: Record<string, { tone: "ok" | "warn" | "err"; text: string }> = {
  canceled: { tone: "warn", text: "Checkout was cancelled. No charge was made." },
  payments_unavailable: { tone: "err", text: "Payments are not set up yet. Please check back soon." },
  price_missing: { tone: "err", text: "That plan is not available for purchase right now." },
  checkout_failed: { tone: "err", text: "Could not start checkout. Please try again." },
  no_customer: { tone: "err", text: "No billing account found for you yet." },
};

const Cell = ({ value }: { value: boolean | string }) => {
  if (typeof value === "string")
    return <span className="text-sm font-medium text-ink">{value}</span>;
  return value ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mx-auto text-primary">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <span className="mx-auto block h-px w-3 bg-line" />
  );
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; canceled?: string }>;
}) {
  // An iOS build without native billing (the first release) has nothing to
  // sell with: Stripe is not allowed in the app and there is no In-App
  // Purchase to offer instead.
  if ((await isIosApp()) && !(await isIosAppWithPurchases())) redirect("/dashboard");
  const platform: "web" | "android" | "ios" = (await isIosApp())
    ? "ios"
    : (await isAndroidApp())
      ? "android"
      : "web";
  const sp = await searchParams;
  const noticeKey = sp.canceled ? "canceled" : sp.error;
  const notice = noticeKey ? NOTICES[noticeKey] : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let currentPlan: string | null = null;
  let billingSource: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("plan, billing_source")
      .eq("id", user.id)
      .maybeSingle<{ plan: string; billing_source: string | null }>();
    currentPlan = data?.plan ?? "free";
    billingSource = data?.billing_source ?? null;
  }

  return (
    <>
      <section className="border-b border-line bg-cream py-16">
        <Container>
          <SectionHeading
            eyebrow="Membership"
            title="Free to join. Pay only when you're ready to talk."
            description="Writing a profile and looking through the members costs nothing. A plan unlocks sending requests, opening conversations and reaching a guardian."
            center
          />
        </Container>
      </section>

      <section className="py-16">
        <Container>
          {notice && (
            <p
              className={`mx-auto mb-8 max-w-2xl rounded-xl border px-4 py-3 text-center text-sm ${
                notice.tone === "err"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : notice.tone === "warn"
                    ? "border-gold/30 bg-gold-light text-gold"
                    : "border-primary/25 bg-primary-light text-primary-dark"
              }`}
            >
              {notice.text}
            </p>
          )}
          {user && currentPlan && currentPlan !== "free" && (
            <p className="mx-auto mb-8 max-w-2xl rounded-xl border border-primary/25 bg-primary-light px-4 py-3 text-center text-sm text-primary-dark">
              You are on the <strong>{planLabel(currentPlan)}</strong> plan.
            </p>
          )}
          <PricingPlans
            loggedIn={Boolean(user)}
            currentPlan={currentPlan}
            platform={platform}
            userId={user?.id ?? null}
            billingSource={billingSource}
          />
          {platform !== "ios" && (
            <p className="mt-8 text-center text-sm text-muted">
              Every paid plan includes a 7-day money-back guarantee.
            </p>
          )}
        </Container>
      </section>

      {/* Comparison table */}
      <section className="border-y border-line bg-cream py-20">
        <Container>
          <SectionHeading eyebrow="Compare" title="What's included in each plan" center />
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-4 pr-4 text-sm font-semibold text-ink">Features</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-ink">Free</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-primary">
                    Full Access
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-ink">
                    Lifetime
                  </th>
                </tr>
              </thead>
              <tbody>
                {planFeatures.map((group) => (
                  <FeatureGroup key={group.group} group={group} />
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="FAQ" title="Frequently asked questions" center />
          <div className="mt-10">
            <Faq
              items={
                // Apple processes iOS payments and refunds, so the web-checkout
                // and 7-day-refund answers don't apply there.
                platform === "ios"
                  ? pricingFaq.filter(
                      (f) => !f.a.includes("money-back") && !f.q.includes("paying on the site"),
                    )
                  : pricingFaq
              }
            />
          </div>
        </Container>
      </section>

      {/* Matchmaking upsell */}
      <section className="pb-8">
        <Container>
          <div className="rounded-2xl border border-line bg-white p-8 shadow-card sm:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Personal matchmaking
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
                  Prefer to let us do the searching?
                </h2>
                <p className="mt-4 leading-relaxed text-muted">
                  One of our team takes on your search directly: they get to know
                  your circumstances, shortlist people worth your time, and stay
                  in contact with you and your guardian as things progress.
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-body">
                  {[
                    "A named person responsible for your search",
                    "A shortlist drawn up around your stated priorities",
                    "Support at each stage, from first contact to the meeting",
                    "First call on new features and community events",
                  ].map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-cream p-6 text-center">
                <p className="font-display text-2xl font-semibold text-ink">By application</p>
                <p className="mt-2 text-sm text-muted">
                  Limited spots each month to keep the service personal.
                </p>
                <div className="mt-6">
                  <Button href={`mailto:${site.email}?subject=Personal%20matchmaking`} className="w-full">
                    Apply for matchmaking
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function FeatureGroup({
  group,
}: {
  group: { group: string; rows: { label: string; free: boolean | string; fullAccess: boolean | string; lifetime: boolean | string }[] };
}) {
  return (
    <>
      <tr className="bg-cream-deep/60">
        <td colSpan={4} className="px-0 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
          {group.group}
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.label} className="border-b border-line">
          <td className="py-3.5 pr-4 text-sm text-body">{row.label}</td>
          <td className="px-4 py-3.5 text-center"><Cell value={row.free} /></td>
          <td className="px-4 py-3.5 text-center"><Cell value={row.fullAccess} /></td>
          <td className="px-4 py-3.5 text-center"><Cell value={row.lifetime} /></td>
        </tr>
      ))}
    </>
  );
}
