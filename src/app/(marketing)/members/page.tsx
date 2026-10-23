import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";
import { SectionHeading } from "@/components/SectionHeading";
import { ProfileCard } from "@/components/ProfileCard";
import { site } from "@/data/site";
import { sisters, brothers } from "@/data/profiles";

export const metadata: Metadata = {
  title: "Members",
  description:
    "A sample of the practicing brothers and sisters currently looking for marriage. Full profiles are visible once you join, which is free.",
};

export default function MembersPage() {
  return (
    <>
      <section className="border-b border-line bg-cream py-16">
        <Container>
          <SectionHeading
            eyebrow="Members"
            title="A look at who is here"
            description="A sample of current members, shown the way every profile is shown: as writing, with no photo. Joining is free and opens the full list."
          />
          <div className="mt-8">
            <Button href={site.registerUrl}>Join free to see everyone</Button>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-5 font-display text-xl font-semibold text-ink">Sisters</h2>
              <div className="space-y-4">
                {sisters.map((p) => (
                  <ProfileCard key={p.id} profile={p} />
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-5 font-display text-xl font-semibold text-ink">Brothers</h2>
              <div className="space-y-4">
                {brothers.map((p) => (
                  <ProfileCard key={p.id} profile={p} />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-cream py-14">
        <Container className="max-w-2xl text-center">
          <p className="text-muted">
            These are a small sample. The full list, with search and the ability to
            send interest, opens once you have a profile.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button href={site.registerUrl}>Start your free profile</Button>
            <Link
              href="/membership"
              className="inline-flex h-11 items-center px-2 text-sm font-medium text-primary hover:underline"
            >
              See what a plan adds →
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
