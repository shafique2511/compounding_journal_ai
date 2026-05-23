"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";

const publicRoutes = new Set(["/login", "/register", "/forgot-password"]);

export function ProtectedRoute({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const { error, isLoading, user } = useAuth();

  if (publicRoutes.has(pathname)) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground">
        {children}
      </main>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-6 py-10 text-sm text-muted-foreground">
        Checking authentication...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <section className="mx-auto max-w-xl rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Authentication Setup Required</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{error}</p>
        </section>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <section className="mx-auto max-w-xl rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Sign in required</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sign in to access your private trading journal, screenshots, strategies, and AI history.
          </p>
          <div className="mt-5 flex gap-3">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
