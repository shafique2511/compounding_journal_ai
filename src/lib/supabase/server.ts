import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Session, User } from "@supabase/supabase-js";
import type { SupabaseAuthUser } from "@/src/lib/supabase/client";

export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
    throw new Error("Supabase is not configured. Add Supabase URL and anon key to the environment.");
  }

  return supabase;
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = await requireSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export async function getCurrentUser(): Promise<SupabaseAuthUser | null> {
  const supabase = await requireSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return withUid(data.user);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Sign in is required.");
  }

  return user;
}

function withUid(user: User | null): SupabaseAuthUser | null {
  return user ? Object.assign(user, { uid: user.id }) : null;
}
