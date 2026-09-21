"use client";

import Link from "next/link";
import Script from "next/script";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  signIn,
  signUp,
  requestPasswordReset,
  signInWithOAuth,
  type AuthState,
} from "@/lib/actions/auth";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
    >
      {pending ? "Working…" : children}
    </button>
  );
}

function Notice({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p className="rounded-md border border-primary/25 bg-primary-light px-3 py-2 text-sm text-primary-dark">
        {state.message}
      </p>
    );
  }
  return null;
}

export function OAuthButtons({ next }: { next: string }) {
  return (
    <div className="grid gap-2">
      <form action={signInWithOAuth}>
        <input type="hidden" name="provider" value="google" />
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line bg-white text-sm font-medium text-ink transition-colors hover:border-primary"
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted">
      <span className="h-px flex-1 bg-line" />
      or with email
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Welcome back.</p>

      <div className="mt-6">
        <OAuthButtons next={next} />
      </div>
      <Divider />

      <form action={action} className="grid gap-3">
        <input type="hidden" name="next" value={next} />
        <label className="grid gap-1 text-sm font-medium text-ink">
          Email
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-ink">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </label>
        <Notice state={state} />
        <SubmitButton>Sign in</SubmitButton>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
        <Link href="/register" className="text-primary hover:underline">
          Create a profile
        </Link>
      </div>
    </div>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signUp, {});
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-muted">
        Free to join. You will write your profile next.
      </p>

      <div className="mt-6">
        <OAuthButtons next={next} />
      </div>
      <Divider />

      <form action={action} className="grid gap-3">
        <input type="hidden" name="next" value={next} />
        <label className="grid gap-1 text-sm font-medium text-ink">
          Email
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-ink">
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={inputClass}
          />
          <span className="text-xs font-normal text-muted">At least 8 characters.</span>
        </label>
        {TURNSTILE_SITE_KEY && (
          <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} />
        )}
        <Notice state={state} />
        <SubmitButton>Create account</SubmitButton>
      </form>
      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          async
          defer
        />
      )}

      <p className="mt-4 text-center text-xs text-muted">
        By continuing you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>
      <p className="mt-3 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">
        We will email you a link to set a new one.
      </p>
      <form action={action} className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm font-medium text-ink">
          Email
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </label>
        <Notice state={state} />
        <SubmitButton>Send reset link</SubmitButton>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
