import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/forms";
import { isIosApp } from "@/lib/native-app";

export const metadata: Metadata = { title: "Create your account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/onboarding";
  return <RegisterForm next={safeNext} native={await isIosApp()} />;
}
