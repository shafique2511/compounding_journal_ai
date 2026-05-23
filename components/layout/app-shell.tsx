import type { ReactNode } from "react";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MotionShell } from "@/components/layout/motion-shell";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen px-4 py-6 pb-24 md:pl-72 md:pr-8 md:pb-8">
        <div className="mx-auto w-full max-w-7xl">
          <MotionShell>{children}</MotionShell>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
