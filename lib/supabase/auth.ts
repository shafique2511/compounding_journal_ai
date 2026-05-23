import { initializeUserAccount } from "@/lib/supabase/database";
import {
  requireSupabaseBrowserClient,
  resetPassword,
  signIn,
  signOut,
  signUp,
  withUid,
  type SupabaseAuthUser,
} from "@/src/lib/supabase/client";

export type AuthUser = SupabaseAuthUser;

export async function registerWithEmail(email: string, password: string) {
  const data = await signUp(email, password);

  if (data.user) {
    await initializeUserAccount(withUid(data.user) as AuthUser);
  }

  return data;
}

export async function loginWithEmail(email: string, password: string) {
  const data = await signIn(email, password);

  if (data.user) {
    await initializeUserAccount(withUid(data.user) as AuthUser);
  }

  return data;
}

export async function loginWithGoogle() {
  const supabase = requireSupabaseBrowserClient();
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
  const redirectTo =
    typeof window === "undefined" ? undefined : `${window.location.origin}/login`;
  return resetPassword(email, redirectTo);
}

export async function logout() {
  await signOut();
}

export function subscribeToAuthState(callback: (user: AuthUser | null) => void) {
  const supabase = requireSupabaseBrowserClient();

  supabase.auth.getUser().then(({ data }) => {
    callback(withUid(data.user));
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(withUid(session?.user ?? null));
  });

  return () => data.subscription.unsubscribe();
}
