"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, LogIn, MailPlus, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { getFriendlyErrorMessage, logTechnicalError } from "@/lib/errors/app-error";
import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  sendPasswordReset,
} from "@/lib/supabase";
import { authCredentialsSchema, authEmailSchema } from "@/lib/validation";

type AuthMode = "login" | "register" | "forgot";

type AuthCardProps = {
  mode: AuthMode;
};

type CredentialsInput = z.infer<typeof authCredentialsSchema>;
type ResetInput = z.infer<typeof authEmailSchema>;

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const isLogin = mode === "login";
  const isForgot = mode === "forgot";

  const credentialsForm = useForm<CredentialsInput>({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(authCredentialsSchema),
  });

  const resetForm = useForm<ResetInput>({
    defaultValues: { email: "" },
    resolver: zodResolver(authEmailSchema),
  });

  async function handleCredentials(values: CredentialsInput) {
    setAuthError("");
    setMessage("");

    try {
      if (isLogin) {
        await loginWithEmail(values.email, values.password);
      } else {
        await registerWithEmail(values.email, values.password);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (caughtError) {
      setAuthError(readAuthError(caughtError));
    }
  }

  async function handleGoogleLogin() {
    setAuthError("");
    setMessage("");

    try {
      await loginWithGoogle();
      router.push("/dashboard");
      router.refresh();
    } catch (caughtError) {
      setAuthError(readAuthError(caughtError));
    }
  }

  async function handleReset(values: ResetInput) {
    setAuthError("");
    setMessage("");

    try {
      await sendPasswordReset(values.email);
      setMessage("Password reset email sent.");
    } catch (caughtError) {
      setAuthError(readAuthError(caughtError));
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border bg-card p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Trade Compounding Journal AI</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {isForgot ? "Reset password" : isLogin ? "Login" : "Create account"}
        </h1>
      </div>

      {isForgot ? (
        <form className="mt-6 space-y-4" onSubmit={resetForm.handleSubmit(handleReset)}>
          <label className="space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              type="email"
              {...resetForm.register("email")}
            />
            {resetForm.formState.errors.email ? (
              <span className="block text-xs text-destructive">
                {resetForm.formState.errors.email.message}
              </span>
            ) : null}
          </label>
          <Button className="w-full" disabled={resetForm.formState.isSubmitting} type="submit">
            {resetForm.formState.isSubmitting ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <KeyRound aria-hidden="true" className="size-4" />
            )}
            Send Reset Email
          </Button>
          <Button asChild className="w-full" type="button" variant="ghost">
            <Link href="/login">Back to Login</Link>
          </Button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={credentialsForm.handleSubmit(handleCredentials)}>
        <label className="space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            type="email"
            {...credentialsForm.register("email")}
          />
          {credentialsForm.formState.errors.email ? (
            <span className="block text-xs text-destructive">
              {credentialsForm.formState.errors.email.message}
            </span>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Password</span>
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            type="password"
            {...credentialsForm.register("password")}
          />
          {credentialsForm.formState.errors.password ? (
            <span className="block text-xs text-destructive">
              {credentialsForm.formState.errors.password.message}
            </span>
          ) : null}
        </label>

        <Button className="w-full" disabled={credentialsForm.formState.isSubmitting} type="submit">
          {credentialsForm.formState.isSubmitting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : isLogin ? (
            <LogIn aria-hidden="true" className="size-4" />
          ) : (
            <MailPlus aria-hidden="true" className="size-4" />
          )}
          {isLogin ? "Login" : "Register"}
        </Button>
        </form>
      )}

      {!isForgot ? (
        <Button className="mt-3 w-full" onClick={handleGoogleLogin} type="button" variant="secondary">
          <UserRound aria-hidden="true" className="size-4" />
          Continue with Google
        </Button>
      ) : null}

      {isLogin ? (
        <form className="mt-6 border-t pt-5" onSubmit={resetForm.handleSubmit(handleReset)}>
          <label className="space-y-2">
            <span className="text-sm font-medium">Forgot password</span>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Email for reset link"
              type="email"
              {...resetForm.register("email")}
            />
          </label>
          <Button
            asChild
            className="mt-3 w-full"
            type="button"
            variant="ghost"
          >
            <Link href="/forgot-password">
              <KeyRound aria-hidden="true" className="size-4" />
              Open Reset Page
            </Link>
          </Button>
        </form>
      ) : null}

      {authError ? <p className="mt-4 text-sm text-destructive">{authError}</p> : null}
      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}

function readAuthError(caughtError: unknown) {
  logTechnicalError(caughtError, { action: "authentication form", source: "auth" });
  return getFriendlyErrorMessage(caughtError, "Authentication request failed. Check your details and try again.");
}
