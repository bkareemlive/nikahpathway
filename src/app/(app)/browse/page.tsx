import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveProfile } from "@/lib/supabase/queries";
import type { ProfileRow } from "@/lib/supabase/types";
import { dobRangeForAges } from "@/lib/profile-display";
import { blockedIdSet } from "@/lib/moderation";
import { MemberCard } from "@/components/app/MemberCard";
import { BrowseFilters, type BrowseParams } from "@/components/app/BrowseFilters";

export const metadata: Metadata = { title: "Browse" };

const PAGE_SIZE = 12;

function clampInt(v: string | undefined, lo: number, hi: number): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(hi, Math.max(lo, Math.trunc(n)));
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<BrowseParams>;
}) {
  const { supabase, user, profile } = await requireActiveProfile();
  const sp = await searchParams;

  const isPaid = profile.plan !== "free";
  const opposite = profile.gender === "sister" ? "brother" : "sister";

  // Hide anyone either party has blocked, in both directions.
  const blocked = await blockedIdSet(supabase, user.id);

  const ageMin = clampInt(sp.age_min, 18, 99);
  const ageMax = clampInt(sp.age_max, 18, 99);
  const { minDob, maxDob } = dobRangeForAges(ageMin, ageMax);
  const page = Math.max(1, clampInt(sp.page, 1, 9999) ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let q = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .eq("gender", opposite)
    .neq("id", user.id);

  if (blocked.size > 0) q = q.not("id", "in", `(${[...blocked].join(",")})`);

  if (sp.country) q = q.eq("location_country", sp.country);
  if (sp.category === "standard" || sp.category === "widowed")
    q = q.eq("category", sp.category);
  if (sp.ethnicity?.trim()) q = q.ilike("ethnicity", `%${sp.ethnicity.trim()}%`);
  if (maxDob) q = q.lte("date_of_birth", maxDob);
  if (minDob) q = q.gte("date_of_birth", minDob);

  if (isPaid) {
    if (sp.prayer) q = q.eq("practice_prayer", sp.prayer);
    if (sp.sect) q = q.eq("sect", sp.sect);
    if (sp.build) q = q.eq("build", sp.build);
    const hMin = clampInt(sp.height_min, 120, 230);
    if (hMin) q = q.gte("height_cm", hMin);
  }

  q =
    isPaid && sp.sort === "active"
      ? q.order("last_active_at", { ascending: false, nullsFirst: false })
      : q.order("created_at", { ascending: false });

  const { data, count } = await q
    .range(from, from + PAGE_SIZE - 1)
    .returns<ProfileRow[]>();

  // Lifetime members get a small visibility boost on the first page.
  const results =
    page === 1
      ? [...(data ?? [])].sort(
          (a, b) =>
            (b.plan === "lifetime" ? 1 : 0) - (a.plan === "lifetime" ? 1 : 0),
        )
      : (data ?? []);
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qs = (patch: Record<string, string | number>) => {
    const usp = new URLSearchParams();
    for (const [k, val] of Object.entries(sp)) if (val) usp.set(k, String(val));
    for (const [k, val] of Object.entries(patch)) usp.set(k, String(val));
    return `/browse?${usp.toString()}`;
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Browse</h1>
      <p className="mt-1 text-sm text-muted">
        {total}{" "}
        {opposite === "sister"
          ? total === 1
            ? "sister"
            : "sisters"
          : total === 1
            ? "brother"
            : "brothers"}{" "}
        {total === 1 ? "matches" : "match"} your filters.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <BrowseFilters params={sp} isPaid={isPaid} />
        </div>

        <div>
          {results.length === 0 ? (
            <div className="rounded-xl border border-line bg-white p-8 text-center text-sm text-muted">
              No profiles match. Try widening your filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((p) => (
                <MemberCard key={p.id} p={p} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="mt-8 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link href={qs({ page: page - 1 })} className="font-medium text-primary hover:underline">
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-muted">
                Page {page} of {pages}
              </span>
              {page < pages ? (
                <Link href={qs({ page: page + 1 })} className="font-medium text-primary hover:underline">
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
