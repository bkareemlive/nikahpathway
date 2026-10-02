"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendInterest, type InterestState } from "@/lib/actions/interest";

export type Relation = "none" | "sent" | "incoming" | "declined" | "matched";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-md bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
    >
      {pending ? "Sending…" : "Express interest"}
    </button>
  );
}

export function InterestButton({
  recipientId,
  relation,
  isDemo = false,
}: {
  recipientId: string;
  relation: Relation;
  isDemo?: boolean;
}) {
  const [state, action] = useActionState<InterestState, FormData>(sendInterest, {});

  if (isDemo) {
    return (
      <p className="rounded-md border border-line bg-cream px-3 py-2.5 text-sm text-muted">
        This is a demo profile, used to preview NikahPathway. It can&apos;t receive
        requests.
      </p>
    );
  }

  if (relation === "matched") {
    return (
      <Link
        href="/matches"
        className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        You have matched: open the conversation →
      </Link>
    );
  }

  if (relation === "incoming") {
    return (
      <Link
        href="/requests"
        className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        They have expressed interest: respond in Requests →
      </Link>
    );
  }

  if (relation === "sent" || state.ok) {
    return (
      <p className="rounded-md border border-primary/25 bg-primary-light px-3 py-2.5 text-sm text-primary-dark">
        Interest sent. If they accept, a conversation opens in Matches.
      </p>
    );
  }

  if (relation === "declined") {
    return (
      <p className="rounded-md border border-line bg-cream px-3 py-2.5 text-sm text-muted">
        This request was declined.
      </p>
    );
  }

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="recipient_id" value={recipientId} />
      <textarea
        name="message"
        rows={2}
        maxLength={500}
        placeholder="Optional note, only shown if they accept your request."
        className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div>
        <Submit />
      </div>
      {state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
