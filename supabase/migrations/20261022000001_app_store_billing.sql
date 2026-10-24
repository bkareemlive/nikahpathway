-- Support Apple In-App Purchase (StoreKit) as a third payment source
-- alongside Stripe and Google Play. iOS purchases never touch Stripe
-- (App Review Guideline 3.1.1); billing_source records which system
-- currently owns a member's paid plan so one source's events never clobber
-- a plan granted by another.

alter table public.profiles
  drop constraint if exists profiles_billing_source_check;

alter table public.profiles
  add constraint profiles_billing_source_check
    check (billing_source in ('stripe', 'google_play', 'apple'));

alter table public.profiles
  add column if not exists apple_original_transaction_id text;

create index if not exists profiles_apple_original_transaction_idx
  on public.profiles (apple_original_transaction_id);
