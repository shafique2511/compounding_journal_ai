"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { useAuthState } from "@/components/auth/auth-state";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  error: string;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  error: "",
});

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const value = useAuthState();

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
