import { createBrowserClient } from "@supabase/ssr";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createFriendlyError } from "@/lib/errors/app-error";
import type { Database } from "@/src/types/supabase";

let browserClient: SupabaseClient<Database> | null = null;

export type SupabaseAuthUser = User;

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

export function requireSupabaseBrowserClient() {
  const supabase = createSupabaseBrowserClient();

  if (!supabase) {
    throw createFriendlyError("Missing Supabase browser configuration.", { source: "auth" });
  }

  return supabase;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await requireSupabaseBrowserClient().auth.signUp({ email, password });

  if (error) {
    throw createFriendlyError(error, { action: "sign up", source: "auth" });
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await requireSupabaseBrowserClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw createFriendlyError(error, { action: "sign in", source: "auth" });
  }

  return data;
}

export async function signOut() {
  const { error } = await requireSupabaseBrowserClient().auth.signOut();

  if (error) {
    throw createFriendlyError(error, { action: "sign out", source: "auth" });
  }
}

export async function resetPassword(email: string, redirectTo?: string) {
  const { data, error } = await requireSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw createFriendlyError(error, { action: "reset password", source: "auth" });
  }

  return data;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await requireSupabaseBrowserClient().auth.getSession();

  if (error) {
    throw createFriendlyError(error, { action: "get session", source: "auth" });
  }

  return data.session;
}

export async function getCurrentUser(): Promise<SupabaseAuthUser | null> {
  const { data, error } = await requireSupabaseBrowserClient().auth.getUser();

  if (error) {
    throw createFriendlyError(error, { action: "get user", source: "auth" });
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

export function normalizeSupabaseUser(user: User | null): SupabaseAuthUser | null {
  return user;
}
