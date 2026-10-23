import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-col bg-white">
      <Header isAuthed={Boolean(user)} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
