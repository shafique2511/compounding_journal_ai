create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  initial_balance numeric default 0,
  currency text default 'USD',
  timezone_offset text default '+00:00',
  date_format text default 'DD/MM/YYYY',
  time_format text default '24-hour',
  default_timeframe text default 'M15',
  default_symbol text default '',
  default_commission numeric default 0,
  default_swap numeric default 0,
  theme_mode text default 'system',
  accent_color text default 'blue',
  ai_provider text default 'gemini',
  ai_model text default '',
  enable_screenshot_analysis boolean default true,
  save_ai_analysis_history boolean default true,
  max_risk_per_trade_percent numeric default 2,
  max_daily_loss_percent numeric default 5,
  max_weekly_loss_percent numeric default 10,
  max_trades_per_day integer default 5,
  max_losing_streak_warning integer default 3,
  minimum_risk_reward_ratio numeric default 1.5,
  enable_risk_warning boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_number integer not null,
  date text not null,
  time text not null,
  timestamp bigint not null,
  symbol text not null,
  direction text not null,
  timeframe text not null,
  entry_price numeric default 0,
  stop_loss numeric default 0,
  take_profit numeric default 0,
  lot_size numeric default 0,
  risk_amount numeric default 0,
  reward_amount numeric default 0,
  gross_profit_loss numeric default 0,
  commission numeric default 0,
  swap numeric default 0,
  net_profit_loss numeric default 0,
  withdrawal_amount numeric default 0,
  starting_balance numeric default 0,
  ending_balance numeric default 0,
  growth_percent numeric default 0,
  risk_reward_ratio numeric default 0,
  r_multiple numeric default 0,
  status text not null,
  strategy_name text default '',
  strategy_id uuid null,
  setup_type text default '',
  emotion_before text default '',
  emotion_after text default '',
  mistake_made text default '',
  lesson_learned text default '',
  notes text default '',
  before_screenshot_url text,
  after_screenshot_url text,
  checklist_trend_confirmed boolean default false,
  checklist_key_level_confirmed boolean default false,
  checklist_entry_reason_confirmed boolean default false,
  checklist_stop_loss_planned boolean default false,
  checklist_take_profit_planned boolean default false,
  checklist_risk_accepted boolean default false,
  checklist_no_revenge_trade boolean default false,
  checklist_no_overlot boolean default false,
  checklist_news_checked boolean default false,
  checklist_emotion_stable boolean default false,
  checklist_score numeric default 0,
  checklist_status text default 'Plan Warning',
  mistake_tags text[] default '{}',
  rule_followed text default 'Partially',
  rule_broken_notes text default '',
  trade_quality_score numeric default 0,
  trade_quality_grade text default 'D',
  review_completed boolean default false,
  review_date text default '',
  review_notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  strategy_name text not null,
  market_type text default '',
  timeframe text default '',
  entry_rules text default '',
  exit_rules text default '',
  stop_loss_rules text default '',
  take_profit_rules text default '',
  risk_rules text default '',
  example_screenshot_url text,
  notes text default '',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.filter_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preset_name text not null,
  date_filter text default '',
  symbol_filter text default '',
  timeframe_filter text default '',
  strategy_filter text default '',
  status_filter text default '',
  quality_grade_filter text default '',
  rule_followed_filter text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  model text default '',
  analysis_type text default '',
  date_range text default '',
  input_summary jsonb default '{}',
  result text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists user_settings_user_id_idx on public.user_settings (user_id);
create index if not exists trades_user_id_idx on public.trades (user_id);
create index if not exists trades_user_timestamp_idx on public.trades (user_id, timestamp desc);
create index if not exists strategies_user_id_idx on public.strategies (user_id);
create index if not exists filter_presets_user_id_idx on public.filter_presets (user_id);
create index if not exists ai_analyses_user_id_idx on public.ai_analyses (user_id);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.trades enable row level security;
alter table public.strategies enable row level security;
alter table public.filter_presets enable row level security;
alter table public.ai_analyses enable row level security;

drop policy if exists "profiles owner read write" on public.profiles;
create policy "profiles owner read write" on public.profiles
for all to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "user settings owner read write" on public.user_settings;
create policy "user settings owner read write" on public.user_settings
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "trades owner read write" on public.trades;
create policy "trades owner read write" on public.trades
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "strategies owner read write" on public.strategies;
create policy "strategies owner read write" on public.strategies
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "filter presets owner read write" on public.filter_presets;
create policy "filter presets owner read write" on public.filter_presets
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "ai analyses owner read write" on public.ai_analyses;
create policy "ai analyses owner read write" on public.ai_analyses
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
