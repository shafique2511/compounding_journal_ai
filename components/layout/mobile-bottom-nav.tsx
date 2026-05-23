"use client";

import Link from "next/link";
import { BarChart3, BookOpen, CalendarDays, Home, LogOut, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth";
import { logout } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const mobileItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 grid border-t bg-card md:hidden",
        user ? "grid-cols-6" : "grid-cols-5",
      )}
    >
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            aria-label={item.label}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-muted-foreground",
              isActive && "text-primary",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" className="size-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      {user ? (
        <button
          aria-label="Logout"
          className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-muted-foreground"
          disabled={isLoggingOut}
          onClick={handleLogout}
          type="button"
        >
          <LogOut aria-hidden="true" className="size-5" />
          <span>Logout</span>
        </button>
      ) : null}
    </nav>
  );
}
