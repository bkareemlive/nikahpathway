"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./Button";
import { Container } from "./Container";
import { nav, site } from "@/data/site";
import { signOut } from "@/lib/actions/auth";

export function Header({ isAuthed = false }: { isAuthed?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-5 xl:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  active ? "text-primary" : "text-body hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          {isAuthed ? (
            <>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm font-medium text-body hover:text-primary"
                >
                  Sign out
                </button>
              </form>
              <Button href={site.dashboardUrl} size="md">
                Go to Dashboard
              </Button>
            </>
          ) : (
            <>
              <Link
                href={site.loginUrl}
                className="text-sm font-medium text-body hover:text-primary"
              >
                Log in
              </Link>
              <Button href={site.registerUrl} size="md">
                Create Profile
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink xl:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </Container>

      {open && (
        <div className="border-t border-line bg-white xl:hidden">
          <Container className="flex flex-col py-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium text-body hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {isAuthed ? (
                <>
                  <Button href={site.dashboardUrl}>Go to Dashboard</Button>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full rounded-md border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Button href={site.loginUrl} variant="secondary">
                    Log in
                  </Button>
                  <Button href={site.registerUrl}>Create Profile</Button>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
