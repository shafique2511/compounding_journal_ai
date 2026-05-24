export type SupabasePublicConfig = {
  anonKey: string;
  url: string;
};

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey || !isValidSupabaseUrl(url)) {
    return null;
  }

  return { anonKey, url };
}

export function getSupabaseConfigErrorMessage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url && !anonKey) {
    return "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  }

  if (!url) {
    return "Supabase URL is missing. Set NEXT_PUBLIC_SUPABASE_URL.";
  }

  if (!isValidSupabaseUrl(url)) {
    return "Supabase URL is invalid. Use the full project URL, for example https://your-project.supabase.co.";
  }

  if (!anonKey) {
    return "Supabase anon key is missing. Set NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  }

  return "Supabase configuration is invalid.";
}

function isValidSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes("supabase.co");
  } catch {
    return false;
  }
}
