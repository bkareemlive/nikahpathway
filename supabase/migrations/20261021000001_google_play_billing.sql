-- Support Google Play Billing as a second payment source alongside Stripe.
-- Android purchases never touch Stripe (see Payments policy: "dating"
-- subscriptions must use Play Billing in-app); this tracks which system
-- currently owns a member's paid plan so one source's events never
-- clobber a plan granted by the other.

alter table public.profiles
  add column if not exists billing_source text
    check (billing_source in ('stripe', 'google_play')),
  add column if not exists google_play_purchase_token text;

create index if not exists profiles_google_play_token_idx
  on public.profiles (google_play_purchase_token);

-- Everyone already paid came through Stripe (Google Play billing didn't
-- exist yet), so backfill accordingly.
update public.profiles
set billing_source = 'stripe'
where plan <> 'free' and billing_source is null;
