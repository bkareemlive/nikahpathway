"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { limitsFor, NUDGE_COOLDOWN_HOURS } from "@/lib/plan";
import { isoHoursAgo } from "@/lib/time";
import { isBlockedBetween } from "@/lib/moderation";

export type NudgeState = { error?: string; ok?: boolean };

const schema = z.object({
  recipient_id: z.string().uuid(),
  redirect_path: z.string().optional(),
});

export async function sendNudge(
  _prev: NudgeState,
  formData: FormData,
): Promise<NudgeState> {
  const parsed = schema.safeParse({
    recipient_id: formData.get("recipient_id"),
    redirect_path: formData.get("redirect_path"),
  });
  if (!parsed.success) return { error: "Something went wrong. Try again." };
  const recipientId = parsed.data.recipient_id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  if (user.id === recipientId) return { error: "That is your own profile." };
  if (await isBlockedBetween(supabase, user.id, recipientId)) {
    return { error: "You cannot contact this member." };
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle<{ plan: string }>();
  if (!limitsFor(me?.plan).sendNudges) {
    return { error: "Upgrade to Full Access or Lifetime to send nudges." };
  }

  // Only nudge people you already have a thread or a pending request with.
  const lo = user.id < recipientId ? user.id : recipientId;
  const hi = user.id < recipientId ? recipientId : user.id;
  const [{ count: matchCount }, { count: pendingCount }] = await Promise.all([
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("a_id", lo)
      .eq("b_id", hi),
    supabase
      .from("interest_requests")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .eq("recipient_id", recipientId)
      .eq("status", "pending"),
  ]);
  if ((matchCount ?? 0) === 0 && (pendingCount ?? 0) === 0) {
    return { error: "You can only nudge a match or someone you have a pending request with." };
  }

  // Cooldown.
  const since = isoHoursAgo(NUDGE_COOLDOWN_HOURS);
  const { count: recent } = await supabase
    .from("nudges")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", user.id)
    .eq("recipient_id", recipientId)
    .gte("created_at", since);
  if ((recent ?? 0) > 0) {
    return { error: `You already nudged them in the last ${NUDGE_COOLDOWN_HOURS} hours.` };
  }

  const { error } = await supabase
    .from("nudges")
    .insert({ sender_id: user.id, recipient_id: recipientId });
  if (error) return { error: error.message };

  if (parsed.data.redirect_path) revalidatePath(parsed.data.redirect_path);
  revalidatePath("/matches");
  revalidatePath("/requests");
  return { ok: true };
}
