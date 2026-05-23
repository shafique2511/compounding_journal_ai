import {
  createSupabaseBrowserClient,
  requireSupabaseBrowserClient,
} from "@/src/lib/supabase/client";

export const STORAGE_BUCKETS = {
  backups: "backups",
  strategyScreenshots: "strategy-screenshots",
  tradeScreenshots: "trade-screenshots",
} as const;

export function getSupabaseClient() {
  return createSupabaseBrowserClient();
}

export function requireSupabaseClient() {
  return requireSupabaseBrowserClient();
}

export function getStorageBucket() {
  return STORAGE_BUCKETS.tradeScreenshots;
}
