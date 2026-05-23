"use client";

import { useSyncExternalStore } from "react";
import { subscribeToAuthState, type AuthUser } from "@/lib/supabase";

type AuthSnapshot = {
  user: AuthUser | null;
  isLoading: boolean;
  error: string;
};

let snapshot: AuthSnapshot = {
  user: null,
  isLoading: true,
  error: "",
};
let unsubscribeAuth: (() => void) | null = null;
const listeners = new Set<() => void>();

function emit(nextSnapshot: AuthSnapshot) {
  snapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
}

function ensureAuthSubscription() {
  if (unsubscribeAuth) {
    return;
  }

  try {
    unsubscribeAuth = subscribeToAuthState((user) => {
      emit({ user, isLoading: false, error: "" });
    });
  } catch (caughtError) {
    emit({
      user: null,
      isLoading: false,
      error: caughtError instanceof Error ? caughtError.message : "Authentication is unavailable.",
    });
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureAuthSubscription();

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return {
    user: null,
    isLoading: true,
    error: "",
  };
}

export function useAuthState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
