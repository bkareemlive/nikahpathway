import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that govern your use of ${site.name}.`,
};

export default function TermsPage() {
  return (
    <section className="py-16">
      <Container className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-muted">Last updated: 9 November 2026</p>

        <div className="prose-nikah mt-10">
          <p>
            These terms govern your use of {site.name} (&ldquo;the service&rdquo;,
            &ldquo;we&rdquo;, &ldquo;us&rdquo;), operated by{" "}
            {site.copyrightHolder}. By creating a profile or otherwise using the
            service, you agree to these terms. If you do not agree, please do not
            use the service.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            You must be at least 18 years old to use {site.name}, regardless of
            the age of marriage recognised in your jurisdiction. The service is
            intended for practicing Muslims who are single and free to marry, and
            who are genuinely seeking marriage. By creating a profile you confirm
            that:
          </p>
          <ul>
            <li>you are at least 18 years old and legally able to marry;</li>
            <li>you are not currently married, unless registering under the widowed category where that applies, or otherwise permitted under your own understanding of the sharia (for example, a brother considering polygyny), and you have represented your situation honestly;</li>
            <li>the information on your profile is accurate and describes you, not another person; and</li>
            <li>you are creating and maintaining only one account.</li>
          </ul>

          <h2>2. The nature of the service</h2>
          <p>
            {site.name} is a marriage introduction service, not a dating or
            social app. Profiles are text only; we do not host photographs on
            member profiles. Every member is expected to keep a guardian (Wali)
            involved as the connection develops, either their own family Wali,
            or an appointed Wali selected from our register for sisters without
            one available. We facilitate the introduction and the guardian&apos;s
            involvement; we are not a party to, and do not perform, any marriage
            contract.
          </p>

          <h2>3. Your account</h2>
          <p>
            You are responsible for the accuracy of your profile, for keeping
            your login credentials confidential, and for all activity under your
            account. Tell us right away at{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a> if you believe your
            account has been accessed without your permission.
          </p>

          <h2>4. The guardian (Wali) register</h2>
          <p>
            Independent Walis listed on the service have provided information
            about themselves and agreed to represent sisters who request them.
            We review this information in good faith, but we do not vouch for,
            and are not responsible for, the conduct of any Wali, family or
            independent. Involving a guardian on this service does not replace
            your own responsibility to satisfy yourself, and where relevant your
            own scholars or community, that a marriage is being conducted
            correctly.
          </p>

          <h2>5. Membership plans and payment</h2>
          <p>
            Free, Full Access and Lifetime plans are described on the{" "}
            <a href="/membership">Membership</a> page, which sets out current
            pricing and what each plan includes. Full Access renews
            automatically at the cadence you choose (monthly or every six
            months) until you cancel; Lifetime is a one-time payment. Payments
            are processed by Stripe; we do not store your card details. You can
            manage or cancel a subscription at any time from your account, which
            takes effect at the end of the current billing period.
          </p>
          <p>
            Every paid plan carries a 7-day money-back guarantee from your first
            purchase of that plan: contact{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a> within 7 days for a
            full refund. Outside that window, payments are non-refundable except
            where required by law.
          </p>

          <h2>6. Acceptable use</h2>
          <p>The service exists for one purpose: seeking marriage with sincere intent. The following are not allowed, and may lead to your account being suspended or closed:</p>
          <ul>
            <li>harassment, abuse, or contacting a member who has asked you to stop;</li>
            <li>misrepresenting who you are, your marital status, or any material fact on your profile;</li>
            <li>sharing another member&apos;s contact details, guardian&apos;s details, or private messages without their consent;</li>
            <li>soliciting money, promoting a business, or using the service for any purpose other than seeking marriage;</li>
            <li>pressuring another member to move communication off the platform before it is appropriate to do so;</li>
            <li>any conduct that is dishonest, abusive, or contrary to the sharia principles this service is built on; and</li>
            <li>child sexual abuse or exploitation (CSAE) in any form. {site.name} is restricted to adults 18 and over (see Section 1) and has zero tolerance for CSAE: any such content or conduct is removed immediately, the account is permanently banned, and the matter is reported to the National Center for Missing &amp; Exploited Children (NCMEC) and other authorities as required by law.</li>
          </ul>

          <h2>7. Reporting and moderation</h2>
          <p>
            You can report or block another member directly from their profile.
            Our team reviews reports and may, at our discretion, suspend or
            close an account that has breached these terms, with or without
            prior notice, depending on severity. A suspended account is hidden
            from other members and loses access to the service until the
            suspension is lifted.
          </p>
          <p>
            To report suspected child sexual abuse or exploitation (CSAE), contact
            our child safety point of contact directly at{" "}
            <a href="mailto:info@alfurqaninternational.org">
              info@alfurqaninternational.org
            </a>
            . These reports receive immediate priority review.
          </p>

          <h2>8. Your content</h2>
          <p>
            You keep ownership of what you write on your profile and in
            messages. By posting it, you give us a licence to display it to
            other members as the service is designed to work: for example,
            showing your profile to members of the opposite gender who match
            your filters, or a message to the person you are messaging.
          </p>

          <h2>9. No guarantee of outcome</h2>
          <p>
            We built {site.name} to give sincere seekers of marriage a
            structured, guardian-led way to find each other, and we take that
            seriously. We do not, however, guarantee that you will find a match,
            that a match will lead to marriage, or that any member&apos;s
            profile, intentions, or guardian information is accurate; you are
            responsible for your own due diligence.
          </p>

          <h2>10. Termination</h2>
          <p>
            You may close your account at any time from your account settings;
            this permanently deletes your profile and related data as described
            in our <a href="/privacy">Privacy Policy</a>. We may suspend or
            close your account for breach of these terms, as described above.
          </p>

          <h2>11. Disclaimers and limitation of liability</h2>
          <p>
            The service is provided &ldquo;as is&rdquo;, without warranties of
            any kind. To the fullest extent permitted by law, {site.copyrightHolder}
            {" "}is not liable for any indirect, incidental, or consequential
            damages arising from your use of the service, including from your
            interactions with other members or guardians.
          </p>

          <h2>12. Changes to these terms</h2>
          <p>
            We may update these terms from time to time. We will change the
            &ldquo;Last updated&rdquo; date above when we do; continuing to use
            the service after a change means you accept the updated terms.
          </p>

          <h2>13. Governing law</h2>
          <p>
            These terms are governed by the laws of the United States, without
            regard to its conflict-of-law principles, to the extent applicable
            to {site.copyrightHolder} as a US-based nonprofit organization.
          </p>

          <h2>14. Contact</h2>
          <p>
            Questions about these terms can be sent to{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
        </div>
      </Container>
    </section>
  );
}
