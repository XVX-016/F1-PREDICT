-- USERS (auth.users already exists)
-- We use a trigger or separate logic to sync profiles, but here we enforce existence
create table if not exists user_profiles (
  id uuid primary key references auth.users(id),
  username text unique,
  created_at timestamptz default now()
);

-- POINTS / CURRENCY
create table if not exists user_points (
  user_id uuid references auth.users(id),
  balance bigint not null default 0,
  last_hourly timestamptz,
  last_daily timestamptz,
  updated_at timestamptz default now(),
  primary key (user_id)
);

-- MARKETS
create table if not exists markets (
  id uuid primary key default gen_random_uuid(),
  race_id uuid references races(id),
  market_type text not null,
  status text check (status in ('open','locked','settled')),
  closing_time timestamptz,
  created_at timestamptz default now()
);

-- MARKET OPTIONS
create table if not exists market_options (
  id uuid primary key default gen_random_uuid(),
  market_id uuid references markets(id),
  label text not null,
  probability numeric,
  odds numeric,
  is_winner boolean default false
);

-- BETS
create table if not exists bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  market_id uuid references markets(id),
  option_id uuid references market_options(id),
  stake bigint not null,
  payout bigint,
  status text check (status in ('open','won','lost')),
  created_at timestamptz default now()
);

-- TRANSACTIONS (audit trail)
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  amount bigint,
  reason text,
  created_at timestamptz default now()
);

-- RLS POLICIES (Preliminary)
alter table bets enable row level security;
alter table user_points enable row level security;
alter table transactions enable row level security;

create policy "users see own bets"
on bets for select
using (auth.uid() = user_id);

create policy "users see own points"
on user_points for select
using (auth.uid() = user_id);

create policy "users see own transactions"
on transactions for select
using (auth.uid() = user_id);
