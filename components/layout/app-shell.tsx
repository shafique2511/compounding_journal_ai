import type { ReactNode } from "react";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MotionShell } from "@/components/layout/motion-shell";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="min-h-screen px-4 py-5 pb-24 md:pl-72 md:pr-8 md:py-8">
        <div className="mx-auto w-full max-w-7xl">
          <header className="mb-6 rounded-lg border bg-card/80 p-4 shadow-sm backdrop-blur md:p-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Trade-by-trade compounding journal
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Trade Compounding Journal AI
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track execution, risk, withdrawals, strategy discipline, and AI-assisted review.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <span className="rounded-md border border-profit/25 bg-profit/10 px-2 py-1 text-profit">
                  Profit
                </span>
                <span className="rounded-md border border-loss/25 bg-loss/10 px-2 py-1 text-loss">
                  Loss
                </span>
                <span className="rounded-md border border-withdrawal/25 bg-withdrawal/10 px-2 py-1 text-withdrawal">
                  Withdrawal
                </span>
                <span className="rounded-md border border-breakeven/30 bg-breakeven/10 px-2 py-1 text-breakeven">
                  Breakeven
                </span>
              </div>
            </div>
          </header>
          <MotionShell>{children}</MotionShell>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
