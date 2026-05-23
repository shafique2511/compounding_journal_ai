"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
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
      setError(caughtError instanceof Error ? caughtError.message : "Logout failed.");
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
