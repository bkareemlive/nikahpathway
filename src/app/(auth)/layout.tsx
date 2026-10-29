import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-cream">
      <header className="px-5 pb-5 sm:px-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 sm:pt-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <footer className="px-5 pb-8 text-center text-xs text-muted">
        <Link href="/" className="hover:text-primary">
          ← Back to nikahpathway.com
        </Link>
      </footer>
    </div>
  );
}
