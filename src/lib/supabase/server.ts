import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Session } from "@supabase/supabase-js";
import { createFriendlyError } from "@/lib/errors/app-error";
import type { SupabaseAuthUser } from "@/src/lib/supabase/client";
import { getSupabaseConfigErrorMessage, getSupabasePublicConfig } from "@/src/lib/supabase/env";
import type { Database } from "@/src/types/supabase";

export async function createSupabaseServerClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. Middleware refreshes sessions for requests.
        }
      },
    },
  });
}

export async function requireSupabaseServerClient() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw createFriendlyError(getSupabaseConfigErrorMessage(), { source: "auth" });
  }

  return supabase;
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = await requireSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw createFriendlyError(error, { action: "get server session", source: "auth" });
  }

  return data.session;
}

export async function getCurrentUser(): Promise<SupabaseAuthUser | null> {
  const supabase = await requireSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw createFriendlyError(error, { action: "get server user", source: "auth" });
  }

  return data.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw createFriendlyError("User not authenticated.", { source: "auth" });
  }

  return user;
}
