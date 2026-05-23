insert into public.profiles (id, email, full_name, avatar_url, updated_at)
select
  users.id,
  users.email,
  '',
  '',
  now()
from auth.users as users
where lower(users.email) = lower('shafique2511@gmail.com')
on conflict (id) do update
set
  email = excluded.email,
  updated_at = now();

insert into public.user_settings (
  user_id,
  initial_balance,
  currency,
  timezone_offset,
  date_format,
  time_format,
  default_timeframe,
  default_symbol,
  default_commission,
  default_swap,
  theme_mode,
  accent_color,
  ai_provider,
  ai_model,
  enable_screenshot_analysis,
  save_ai_analysis_history,
  max_risk_per_trade_percent,
  max_daily_loss_percent,
  max_weekly_loss_percent,
  max_trades_per_day,
  max_losing_streak_warning,
  minimum_risk_reward_ratio,
  enable_risk_warning,
  updated_at
)
select
  users.id,
  10000,
  'USD',
  '+00:00',
  'DD/MM/YYYY',
  '24-hour',
  'M15',
  '',
  0,
  0,
  'system',
  'blue',
  'gemini',
  '',
  true,
  true,
  2,
  5,
  10,
  5,
  3,
  1.5,
  true,
  now()
from auth.users as users
where lower(users.email) = lower('shafique2511@gmail.com')
on conflict (user_id) do update
set
  updated_at = now();
