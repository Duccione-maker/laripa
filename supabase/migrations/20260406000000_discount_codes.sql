-- discount_codes table
create table if not exists public.discount_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  discount_type text not null check (discount_type in ('fixed', 'percent')),
  value       numeric not null,
  active      boolean not null default true,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Add country_code column to analytics_events if not present
alter table public.analytics_events
  add column if not exists country_code text;

-- RLS
alter table public.discount_codes enable row level security;

-- Admins can do everything, anon/service can only read active codes
create policy "Admin full access on discount_codes"
  on public.discount_codes
  for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Service role read discount_codes"
  on public.discount_codes
  for select
  using (true);

-- Seed data
insert into public.discount_codes (code, discount_type, value, active)
values
  ('KNOW99', 'fixed',   99, true),
  ('KNOW49', 'fixed',   49, true),
  ('MIMANDADUCCIO', 'percent', 10, true)
on conflict (code) do nothing;
