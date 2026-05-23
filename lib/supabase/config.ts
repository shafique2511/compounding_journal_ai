import {
  createSupabaseBrowserClient,
  requireSupabaseBrowserClient,
} from "@/src/lib/supabase/client";
const STORAGE_BUCKET = "trade-journal";

export function getSupabaseClient() {
  return createSupabaseBrowserClient();
}

export function requireSupabaseClient() {
  return requireSupabaseBrowserClient();
}

export function getStorageBucket() {
  return STORAGE_BUCKET;
}
