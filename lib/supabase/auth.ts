import type { User } from "@supabase/supabase-js";
import { requireSupabaseClient } from "@/lib/supabase/config";
import { initializeUserAccount } from "@/lib/supabase/database";

export type AuthUser = User & { uid: string };

function withUid(user: User | null): AuthUser | null {
  return user ? Object.assign(user, { uid: user.id }) : null;
}

export async function registerWithEmail(email: string, password: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  if (data.user) {
    await initializeUserAccount(withUid(data.user) as AuthUser);
  }

  return data;
}

export async function loginWithEmail(email: string, password: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  if (data.user) {
    await initializeUserAccount(withUid(data.user) as AuthUser);
  }

  return data;
}

export async function loginWithGoogle() {
  const supabase = requireSupabaseClient();
  const redirectTo =
    typeof window === "undefined" ? undefined : `${window.location.origin}/dashboard`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function sendPasswordReset(email: string) {
  const supabase = requireSupabaseClient();
  const redirectTo =
    typeof window === "undefined" ? undefined : `${window.location.origin}/login`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function logout() {
  const { error } = await requireSupabaseClient().auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export function subscribeToAuthState(callback: (user: AuthUser | null) => void) {
  const supabase = requireSupabaseClient();

  supabase.auth.getUser().then(({ data }) => {
    callback(withUid(data.user));
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(withUid(session?.user ?? null));
  });

  return () => data.subscription.unsubscribe();
}
