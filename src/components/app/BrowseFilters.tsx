import Link from "next/link";
import {
  COUNTRIES,
  PRACTICE_PRAYER_OPTIONS,
  SECT_OPTIONS,
  BUILD_OPTIONS,
} from "@/lib/profile-options";

export type BrowseParams = Record<string, string | undefined>;

const field =
  "w-full rounded-md border border-line bg-white px-2.5 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-cream-deep disabled:text-muted";
const legendCls = "text-xs font-semibold uppercase tracking-wider text-muted";

export function BrowseFilters({
  params,
  isPaid,
}: {
  params: BrowseParams;
  isPaid: boolean;
}) {
  const v = (k: string) => params[k] ?? "";

  return (
    <form
      method="get"
      action="/browse"
      className="rounded-xl border border-line bg-white p-5 shadow-card"
    >
      <div className="grid gap-4">
        <div>
          <p className={legendCls}>Age</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              name="age_min"
              type="number"
              min={18}
              max={99}
              placeholder="min"
              defaultValue={v("age_min")}
              className={field}
            />
            <span className="text-muted">–</span>
            <input
              name="age_max"
              type="number"
              min={18}
              max={99}
              placeholder="max"
              defaultValue={v("age_max")}
              className={field}
            />
          </div>
        </div>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Country
          <select name="country" defaultValue={v("country")} className={field}>
            <option value="">Any country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Ethnic background
          <input
            name="ethnicity"
            placeholder="e.g. Somali"
            defaultValue={v("ethnicity")}
            className={field}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Category
          <select name="category" defaultValue={v("category")} className={field}>
            <option value="">Everyone</option>
            <option value="standard">Standard</option>
            <option value="widowed">Widowed</option>
          </select>
        </label>

        <div className="border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <p className={legendCls}>Detailed filters</p>
            {!isPaid && (
              <Link href="/membership" className="text-xs font-medium text-primary hover:underline">
                Upgrade to use
              </Link>
            )}
          </div>

          <div className="mt-3 grid gap-4">
            <label className="grid gap-1 text-sm font-medium text-ink">
              Prayer
              <select name="prayer" defaultValue={v("prayer")} disabled={!isPaid} className={field}>
                <option value="">Any</option>
                {PRACTICE_PRAYER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-ink">
              Understanding
              <select name="sect" defaultValue={v("sect")} disabled={!isPaid} className={field}>
                <option value="">Any</option>
                {SECT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-ink">
              Build
              <select name="build" defaultValue={v("build")} disabled={!isPaid} className={field}>
                <option value="">Any</option>
                {BUILD_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-ink">
              Minimum height (cm)
              <input
                name="height_min"
                type="number"
                min={120}
                max={230}
                defaultValue={v("height_min")}
                disabled={!isPaid}
                className={field}
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-ink">
              Sort by
              <select name="sort" defaultValue={v("sort")} disabled={!isPaid} className={field}>
                <option value="">Newest members</option>
                <option value="active">Recently active</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Apply filters
          </button>
          <Link href="/browse" className="text-sm font-medium text-muted hover:text-primary">
            Clear
          </Link>
        </div>
      </div>
    </form>
  );
}
