import Link from "next/link";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { footerNav, site } from "@/data/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-cream">
      <Container className="py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {site.tagline} A marriage introduction service for practicing
              Muslims, Wali-led, with text-based profiles and a focus on
              meeting in person.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                Explore
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {footerNav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-muted hover:text-primary">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                Legal
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link href="/terms" className="text-muted hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-muted hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/safety" className="text-muted hover:text-primary">
                    Child Safety Standards
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                Connect
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a href={site.instagram} className="text-muted hover:text-primary" target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href={`mailto:${site.email}`} className="text-muted hover:text-primary">
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()}{" "}
            <a
              href={site.copyrightHolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              {site.copyrightHolder}
            </a>
            . All rights reserved.
          </p>
          <p>{site.name}: a newly launched marriage service, Wali-led and free to join.</p>
        </div>
      </Container>
    </footer>
  );
}
