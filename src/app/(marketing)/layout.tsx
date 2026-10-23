import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { isIosAppWithoutPurchases } from "@/lib/native-app";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const native = await isIosAppWithoutPurchases();

  return (
    <div className="flex min-h-full flex-col bg-white">
      <Header isAuthed={Boolean(user)} native={native} />
      <main className="flex-1">{children}</main>
      <Footer native={native} />
    </div>
  );
}
