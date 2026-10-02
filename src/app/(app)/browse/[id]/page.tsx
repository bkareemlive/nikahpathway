import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/supabase/queries";
import type { ProfileRow, InterestRequestRow, MatchRow } from "@/lib/supabase/types";
import {
  ageFromDob,
  label,
  PRAYER_LABELS,
  SECT_LABELS,
  MARITAL_LABELS,
  TIMELINE_LABELS,
  RELOCATE_LABELS,
  WANTS_CHILDREN_LABELS,
} from "@/lib/profile-display";
import { RecordView } from "@/components/app/RecordView";
import { InterestButton, type Relation } from "@/components/app/InterestButton";
import { ReportBlockMenu } from "@/components/app/ReportBlockMenu";
import { SaveToggle } from "@/components/app/SaveToggle";

export const metadata: Metadata = { title: "Member" };

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireActiveProfile();

  if (id === user.id) redirect("/profile");

  const { data: blockRows } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(
      `and(blocker_id.eq.${user.id},blocked_id.eq.${id}),and(blocker_id.eq.${id},blocked_id.eq.${user.id})`,
    )
    .returns<{ blocker_id: string; blocked_id: string }[]>();
  const iBlockedThem = (blockRows ?? []).some((b) => b.blocker_id === user.id);
  const theyBlockedMe = (blockRows ?? []).some((b) => b.blocker_id === id);

  if (theyBlockedMe && !iBlockedThem) {
    return (
      <div>
        <Link href="/browse" className="text-sm font-medium text-primary hover:underline">
          ← Back to browse
        </Link>
        <p className="mt-6 rounded-xl border border-line bg-white p-8 text-center text-sm text-muted">
          This profile is not available.
        </p>
      </div>
    );
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle<ProfileRow>();

  if (!target) notFound();

  if (iBlockedThem) {
    return (
      <div>
        <Link href="/browse" className="text-sm font-medium text-primary hover:underline">
          ← Back to browse
        </Link>
        <div className="mt-6 rounded-xl border border-line bg-white p-8 text-center">
          <p className="text-sm text-muted">
            You have blocked{" "}
            <span className="font-medium text-ink">
              {target.alias ?? target.public_ref}
            </span>
            . Unblock to see their profile and interact.
          </p>
          <div className="mt-4 flex justify-center">
            <ReportBlockMenu targetId={id} blocked />
          </div>
        </div>
      </div>
    );
  }

  const [{ data: requests }, { data: matches }, { data: savedRow }] = await Promise.all([
    supabase
      .from("interest_requests")
      .select("sender_id, recipient_id, status")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${user.id})`,
      )
      .returns<Pick<InterestRequestRow, "sender_id" | "recipient_id" | "status">[]>(),
    supabase
      .from("matches")
      .select("a_id, b_id")
      .or(`and(a_id.eq.${user.id},b_id.eq.${id}),and(a_id.eq.${id},b_id.eq.${user.id})`)
      .returns<Pick<MatchRow, "a_id" | "b_id">[]>(),
    supabase
      .from("saved_profiles")
      .select("saved_id")
      .eq("user_id", user.id)
      .eq("saved_id", id)
      .maybeSingle<{ saved_id: string }>(),
  ]);
  const isSaved = Boolean(savedRow);

  let relation: Relation = "none";
  if ((matches?.length ?? 0) > 0) relation = "matched";
  else {
    const mine = requests?.find((r) => r.sender_id === user.id);
    const theirs = requests?.find((r) => r.sender_id === id);
    if (theirs && theirs.status === "pending") relation = "incoming";
    else if (mine?.status === "pending") relation = "sent";
    else if (mine?.status === "declined" || theirs?.status === "declined")
      relation = "declined";
  }

  const age = ageFromDob(target.date_of_birth);
  const facts: [string, string][] = [
    ["Age", age ? String(age) : "—"],
    ["Ethnic background", target.ethnicity ?? "—"],
    ["Lives in", [target.location_city, target.location_country].filter(Boolean).join(", ") || "—"],
    ["Marital status", label(MARITAL_LABELS, target.marital_status)],
    ["Children", target.has_children ? target.children_note || "Yes" : "None"],
    ["Prayer", label(PRAYER_LABELS, target.practice_prayer)],
    ["Understanding", label(SECT_LABELS, target.sect)],
    ["Timeline", label(TIMELINE_LABELS, target.timeline)],
    ["Would relocate", label(RELOCATE_LABELS, target.relocate)],
    ["Children in marriage", label(WANTS_CHILDREN_LABELS, target.wants_children)],
    ["Height", target.height_cm ? `${target.height_cm} cm` : "—"],
    ["Build", target.build ?? "—"],
    [
      "Guardian",
      target.gender === "brother"
        ? "Represents himself"
        : target.wali_type === "family"
          ? "Family guardian"
          : target.wali_type === "independent"
            ? "Appointed (independent) Wali"
            : "Being arranged",
    ],
  ];

  return (
    <div>
      <RecordView viewedId={id} />

      <div className="flex items-center justify-between">
        <Link href="/browse" className="text-sm font-medium text-primary hover:underline">
          ← Back to browse
        </Link>
        <div className="flex items-center gap-3">
          <SaveToggle targetId={id} saved={isSaved} />
          <ReportBlockMenu targetId={id} blocked={false} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        {target.is_demo && (
          <p className="mb-4 inline-block rounded-full border border-dashed border-muted/60 px-3 py-1 text-xs font-medium text-muted">
            Demo profile, used to preview NikahPathway, not a real member.
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold text-ink">
          {target.alias ?? target.public_ref ?? "Member"}
          {target.alias && (
            <span className="ml-2 text-base font-normal text-muted">· {target.public_ref}</span>
          )}
        </h1>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</dt>
              <dd className="mt-0.5 text-sm text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        {target.about && (
          <div className="mt-8">
            <h2 className="font-display text-lg font-semibold text-ink">About</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-body">
              {target.about}
            </p>
          </div>
        )}

        {target.looking_for && (
          <div className="mt-6">
            <h2 className="font-display text-lg font-semibold text-ink">
              What they are looking for
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-body">
              {target.looking_for}
            </p>
          </div>
        )}

        <div className="mt-8 border-t border-line pt-6">
          <InterestButton recipientId={id} relation={relation} isDemo={target.is_demo} />
        </div>
      </div>
    </div>
  );
}
