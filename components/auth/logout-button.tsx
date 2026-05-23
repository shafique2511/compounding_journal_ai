"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { getFriendlyErrorMessage, logTechnicalError } from "@/lib/errors/app-error";
import { logout } from "@/lib/supabase";

export function LogoutButton() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState("");

  if (!user) {
    return null;
  }

  async function handleLogout() {
    setError("");

    try {
      await logout();
      router.push("/login");
    } catch (caughtError) {
      logTechnicalError(caughtError, { action: "logout", source: "auth" });
      setError(getFriendlyErrorMessage(caughtError, "Logout failed. Please try again."));
    }
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={handleLogout} type="button" variant="secondary">
        <LogOut aria-hidden="true" className="size-4" />
        Logout
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
