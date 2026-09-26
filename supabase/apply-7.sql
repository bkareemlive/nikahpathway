-- Interest-request cycles with one-cycle carry-over, plus a guard so members
-- cannot edit billing/privilege columns on their own profile row.

-- ---------------------------------------------------------------------------
-- req_anchor: start of the member's subscription cycle clock (null when they
--             have no active subscription). Cycle k = [anchor + k months, anchor + k+1 months).
-- req_cycle:  the cycle the stored carry belongs to.
-- req_carry:  unused requests carried in from the immediately previous cycle.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists req_anchor timestamptz,
  add column if not exists req_cycle integer not null default 0 check (req_cycle >= 0),
  add column if not exists req_carry integer not null default 0 check (req_carry >= 0);

-- ---------------------------------------------------------------------------
-- The "profiles update own" policy lets a signed-in member update every column
-- of their row, including plan and role. Reset the privileged ones for normal
-- members. Trusted callers (service role, SQL editor) have no auth.uid(), and
-- admins may change anything.
-- ---------------------------------------------------------------------------
create or replace function public.guard_privileged_profile_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  new.role := old.role;
  new.plan := old.plan;
  new.plan_since := old.plan_since;
  new.stripe_customer_id := old.stripe_customer_id;
  new.req_anchor := old.req_anchor;
  new.req_cycle := old.req_cycle;
  new.req_carry := old.req_carry;
  if old.status = 'suspended' then
    new.status := old.status;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged on public.profiles;
create trigger profiles_guard_privileged
  before update on public.profiles
  for each row execute function public.guard_privileged_profile_columns();
