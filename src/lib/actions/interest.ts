"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { limitsFor } from "@/lib/plan";
import { addMonths, advanceCycle, cycleIndexAt } from "@/lib/request-cycles";
import { isBlockedBetween } from "@/lib/moderation";

export type InterestState = { error?: string; ok?: boolean };
export type RespondState = { error?: string; ok?: boolean; matched?: boolean };

export async function sendInterest(
  _prev: InterestState,
  formData: FormData,
): Promise<InterestState> {
  const recipient = z.string().uuid().safeParse(formData.get("recipient_id"));
  if (!recipient.success) return { error: "Something went wrong. Try again." };
  const message = z
    .string()
    .trim()
    .max(500)
    .optional()
    .parse((formData.get("message") as string) || undefined);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  if (user.id === recipient.data) return { error: "That is your own profile." };
  if (await isBlockedBetween(supabase, user.id, recipient.data)) {
    return { error: "You cannot contact this member." };
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("plan, req_anchor, req_cycle, req_carry")
    .eq("id", user.id)
    .maybeSingle<{
      plan: string;
      req_anchor: string | null;
      req_cycle: number;
      req_carry: number;
    }>();
  const limits = limitsFor(me?.plan);

  if (limits.interestRequestsPerMonth === 0) {
    return { error: "Upgrade to Full Access or Lifetime to send interest requests." };
  }
  if (limits.interestRequestsPerMonth !== null) {
    const base = limits.interestRequestsPerMonth;
    const now = new Date();
    const countSent = async (from: Date, to?: Date) => {
      let q = supabase
        .from("interest_requests")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", user.id)
        .gte("created_at", from.toISOString());
      if (to) q = q.lt("created_at", to.toISOString());
      const { count } = await q;
      return count ?? 0;
    };

    // Members whose cycle clock is not set yet fall back to a rolling 30 days.
    let allowance = base;
    let windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (me?.req_anchor) {
      const anchor = new Date(me.req_anchor);
      const current = cycleIndexAt(anchor, now);
      let state = { cycle: me.req_cycle, carry: me.req_carry };
      if (current > state.cycle) {
        const usedBefore = await countSent(
          addMonths(anchor, state.cycle),
          addMonths(anchor, state.cycle + 1),
        );
        state = advanceCycle(state, current, usedBefore, base);
        await createAdminClient()
          .from("profiles")
          .update({ req_cycle: state.cycle, req_carry: state.carry })
          .eq("id", user.id);
      }
      windowStart = addMonths(anchor, state.cycle);
      allowance = base + state.carry;
    }

    if ((await countSent(windowStart)) >= allowance) {
      return {
        error: `You have used all ${allowance} interest requests for this billing period. More become available when your plan renews.`,
      };
    }
  }

  const { error } = await supabase.from("interest_requests").insert({
    sender_id: user.id,
    recipient_id: recipient.data,
    message: message || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "You have already expressed interest." };
    return { error: error.message };
  }

  revalidatePath(`/browse/${recipient.data}`);
  return { ok: true };
}

const idSchema = z.string().uuid();

/** Recipient accepts or declines an incoming interest request. */
export async function respondToRequest(
  _prev: RespondState,
  formData: FormData,
): Promise<RespondState> {
  const requestId = idSchema.safeParse(formData.get("request_id"));
  const decision = formData.get("decision");
  if (!requestId.success || (decision !== "accept" && decision !== "decline")) {
    return { error: "Something went wrong. Try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  if (decision === "accept") {
    const { data: req } = await supabase
      .from("interest_requests")
      .select("sender_id")
      .eq("id", requestId.data)
      .maybeSingle<{ sender_id: string }>();
    if (req && (await isBlockedBetween(supabase, user.id, req.sender_id))) {
      return { error: "You cannot accept this: one of you has blocked the other." };
    }

    const { error } = await supabase.rpc("accept_interest_request", {
      request_id: requestId.data,
    });
    if (error) return { error: error.message };
    revalidatePath("/requests");
    revalidatePath("/matches");
    return { ok: true, matched: true };
  }

  const { error } = await supabase
    .from("interest_requests")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", requestId.data)
    .eq("recipient_id", user.id)
    .eq("status", "pending");
  if (error) return { error: error.message };
  revalidatePath("/requests");
  return { ok: true };
}

/** Sender withdraws a pending request they made. */
export async function withdrawRequest(
  _prev: RespondState,
  formData: FormData,
): Promise<RespondState> {
  const requestId = idSchema.safeParse(formData.get("request_id"));
  if (!requestId.success) return { error: "Something went wrong. Try again." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { error } = await supabase
    .from("interest_requests")
    .update({ status: "withdrawn", responded_at: new Date().toISOString() })
    .eq("id", requestId.data)
    .eq("sender_id", user.id)
    .eq("status", "pending");
  if (error) return { error: error.message };
  revalidatePath("/requests");
  return { ok: true };
}
