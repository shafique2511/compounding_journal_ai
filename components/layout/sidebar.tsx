"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Download,
  LayoutDashboard,
  LineChart,
  NotebookText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { LogoutButton } from "@/components/auth";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

const navIcons = {
  "/dashboard": LayoutDashboard,
  "/journal": NotebookText,
  "/calendar": CalendarDays,
  "/review": ShieldCheck,
  "/analytics": BarChart3,
  "/ai-analysis": Bot,
  "/strategies": LineChart,
  "/settings": Settings,
  "/export": Download,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card/95 px-4 py-6 shadow-sm backdrop-blur md:block">
      <div className="mb-8">
        <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-analytics text-primary-foreground">
          <LineChart aria-hidden="true" className="size-5" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Trading Journal
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Trade Compounding Journal AI</h1>
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = navIcons[item.href];
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute inset-x-4 bottom-6">
        <LogoutButton />
      </div>
    </aside>
  );
}
