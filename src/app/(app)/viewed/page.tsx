import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveProfile } from "@/lib/supabase/queries";
import { ageFromDob } from "@/lib/profile-display";
import { limitsFor } from "@/lib/plan";

export const metadata: Metadata = { title: "Who viewed you" };

type ViewerMini = {
  id: string;
  alias: string | null;
  public_ref: string | null;
  date_of_birth: string | null;
  ethnicity: string | null;
  location_city: string | null;
  location_country: string | null;
};
type ViewRow = {
  viewed_at: string;
  viewer: ViewerMini | ViewerMini[] | null;
};

const one = <T,>(v: T | T[] | null): T | null =>
  v == null ? null : Array.isArray(v) ? (v[0] ?? null) : v;

function when(iso: string) {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 60) return `${Math.max(1, d)}m ago`;
  if (d < 1440) return `${Math.round(d / 60)}h ago`;
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
}

export default async function ViewedPage() {
  const { supabase, user, profile } = await requireActiveProfile();
  const limits = limitsFor(profile.plan);

  const { count } = await supabase
    .from("profile_views")
    .select("viewer_id", { count: "exact", head: true })
    .eq("viewed_id", user.id);
  const total = count ?? 0;

  if (!limits.seeWhoViewedYou) {
    return (
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">
          Who viewed your profile
        </h1>
        <div className="mt-8 rounded-2xl border border-line bg-white p-8 text-center shadow-card">
          <p className="font-display text-4xl font-semibold text-primary">{total}</p>
          <p className="mt-1 text-sm text-muted">
            {total === 1 ? "member has" : "members have"} looked at your profile.
          </p>
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted">
            See exactly who, and when, with Full Access or Lifetime.
          </p>
          <div className="mt-5">
            <Link
              href="/membership"
              className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              View membership
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data } = await supabase
    .from("profile_views")
    .select(
      "viewed_at, viewer:viewer_id(id, alias, public_ref, date_of_birth, ethnicity, location_city, location_country)",
    )
    .eq("viewed_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(100)
    .returns<ViewRow[]>();

  const views = data ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">
        Who viewed your profile
      </h1>
      <p className="mt-1 text-sm text-muted">
        {total} {total === 1 ? "view" : "views"} in total.
      </p>

      {views.length === 0 ? (
        <p className="mt-8 rounded-xl border border-line bg-white p-6 text-sm text-muted">
          No one has viewed your profile yet.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {views.map((v, i) => {
            const p = one(v.viewer);
            const age = p ? ageFromDob(p.date_of_birth) : null;
            return (
              <li key={`${p?.id ?? "x"}-${i}`}>
                {p ? (
                  <Link
                    href={`/browse/${p.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white p-4 shadow-card transition-colors hover:border-primary"
                  >
                    <div>
                      <p className="font-display text-lg font-semibold text-ink">
                        {p.alias ? `${p.alias} · ${p.public_ref}` : p.public_ref}
                      </p>
                      <p className="text-sm text-muted">
                        {[
                          age,
                          p.ethnicity,
                          [p.location_city, p.location_country].filter(Boolean).join(", "),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{when(v.viewed_at)}</span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-line bg-white p-4 text-sm text-muted">
                    <span>A member (profile no longer visible)</span>
                    <span className="text-xs">{when(v.viewed_at)}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
