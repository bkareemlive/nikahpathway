import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Child Safety Standards",
  description:
    "NikahPathway's published standards against child sexual abuse and exploitation.",
};

export default function SafetyPage() {
  return (
    <section className="py-16">
      <Container className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
          Child Safety Standards
        </h1>
        <p className="mt-3 text-sm text-muted">Last updated: 5 October 2026</p>

        <div className="prose-nikah mt-10">
          <p>
            {site.name}, operated by {site.copyrightHolder}, is a marriage
            introduction service for adults. This page sets out our standards
            against child sexual abuse and exploitation (CSAE), published in
            line with Google Play&apos;s child safety standards policy.
          </p>

          <h2>Adults only</h2>
          <p>
            Every member must give a date of birth when creating a profile,
            and a declared age under 18 blocks the profile from being
            completed. This is a declared age, not an identity-document
            check. If we become aware that an account belongs to someone
            under 18, we remove the profile and the account.
          </p>

          <h2>No photos, by design</h2>
          <p>
            {site.name} does not support photos anywhere on the platform.
            Every profile is read as writing. This is a deliberate design
            choice that also removes image-based grooming and exploitation
            as a vector on the service.
          </p>

          <h2>A guardian is part of the process</h2>
          <p>
            A Wali (guardian) can be part of a member&apos;s conversations once
            they open, and guardian contact details are shared once both
            sides are serious about a match. This keeps a trusted adult
            involved in how a match develops, rather than leaving two
            strangers to arrange contact on their own.
          </p>

          <h2>Reporting a concern</h2>
          <p>
            Any member can report another member&apos;s profile or
            conversation directly in the app, including as a fake or
            misrepresented profile, or any other concern they describe in
            their own words. A report can also be sent directly to{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
          <p>
            Reports go to our trust &amp; safety team for review. An account
            found to involve a minor, or any child sexual abuse material or
            conduct, is removed immediately on discovery, without waiting
            for a full review cycle.
          </p>

          <h2>Legal cooperation</h2>
          <p>
            We comply with applicable child safety laws and cooperate with
            law enforcement and legal process, including when responding to
            a report or legal request concerning a minor.
          </p>

          <h2>Contact</h2>
          <p>
            The person responsible for child safety standards and
            compliance for {site.name} can be reached at{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
        </div>
      </Container>
    </section>
  );
}
