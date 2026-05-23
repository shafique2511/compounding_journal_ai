import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
const STORAGE_BUCKET = "trade-journal";

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

export function requireSupabaseClient() {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase is not configured. Add Supabase URL and anon key to the environment.");
  }

  return client;
}

export function getStorageBucket() {
  return STORAGE_BUCKET;
}
