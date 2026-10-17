import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/forms";
import { isIosApp } from "@/lib/native-app";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/dashboard";

  return (
    <>
      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Sign-in failed. Please try again.
        </p>
      )}
      <LoginForm next={safeNext} native={await isIosApp()} />
    </>
  );
}
