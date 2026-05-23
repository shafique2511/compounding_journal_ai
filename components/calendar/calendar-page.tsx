"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useJournalStore } from "@/store";
import type { Trade } from "@/types";
import { cn } from "@/lib/utils";

type DaySummary = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  trades: Trade[];
  netProfitLoss: number;
  withdrawals: number;
  wins: number;
  losses: number;
  bestTrade: number;
  worstTrade: number;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarPage() {
  const trades = useJournalStore((state) => state.trades);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const days = useMemo(() => buildMonthDays(visibleMonth, trades), [trades, visibleMonth]);
  const selectedSummary =
    days.find((day) => day.date === selectedDate) ?? createDaySummary(selectedDate, false, trades);

  function moveMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Calendar
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Monthly Performance</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => moveMonth(-1)} size="icon" type="button" variant="secondary">
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <p className="min-w-40 text-center text-sm font-medium">
            {visibleMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </p>
          <Button onClick={() => moveMonth(1)} size="icon" type="button" variant="secondary">
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-lg border bg-card p-3 shadow-sm md:p-5">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {weekdayLabels.map((weekday) => (
              <div className="py-2" key={weekday}>{weekday}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => (
              <button
                className={cn(
                  "min-h-24 rounded-md border p-2 text-left transition-colors md:min-h-32",
                  day.isCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground",
                  day.date === selectedDate && "ring-2 ring-primary",
                  day.netProfitLoss > 0 && "border-profit/30 bg-profit/10",
                  day.netProfitLoss < 0 && "border-loss/30 bg-loss/10",
                  day.netProfitLoss === 0 && "border-breakeven/20",
                )}
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                type="button"
              >
                <span className="text-sm font-semibold">{day.dayNumber}</span>
                <div className="mt-3 space-y-1">
                  <p className={cn("text-xs font-medium", day.netProfitLoss > 0 ? "text-profit" : day.netProfitLoss < 0 ? "text-loss" : "text-breakeven")}>
                    {money(day.netProfitLoss)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {day.trades.length} {day.trades.length === 1 ? "trade" : "trades"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <DailySummary summary={selectedSummary} />
      </div>
    </section>
  );
}

function DailySummary({ summary }: { summary: DaySummary }) {
  return (
    <aside className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Daily Summary
      </p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight">{summary.date}</h3>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <Metric label="Total trades" value={summary.trades.length} />
        <Metric label="Wins" value={summary.wins} tone="profit" />
        <Metric label="Losses" value={summary.losses} tone="loss" />
        <Metric label="Net profit/loss" value={money(summary.netProfitLoss)} tone={summary.netProfitLoss >= 0 ? "profit" : "loss"} />
        <Metric label="Withdrawals" value={money(summary.withdrawals)} tone="withdrawal" />
        <Metric label="Best trade" value={money(summary.bestTrade)} tone="profit" />
        <Metric label="Worst trade" value={money(summary.worstTrade)} tone="loss" />
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-semibold">Trades</h4>
        <div className="mt-3 space-y-2">
          {summary.trades.map((trade) => (
            <Link
              className="block rounded-md border bg-background p-3 text-sm transition-colors hover:bg-accent"
              href={`/journal/${trade.id}`}
              key={trade.id}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">#{trade.tradeNumber} {trade.symbol}</span>
                <span className={trade.netProfitLoss >= 0 ? "text-profit" : "text-loss"}>
                  {money(trade.netProfitLoss)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {trade.time} / {trade.direction} / {trade.timeframe} / {trade.status}
              </p>
            </Link>
          ))}
          {summary.trades.length === 0 ? (
            <p className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
              No trades for this day.
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function Metric({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "loss" | "neutral" | "profit" | "withdrawal";
  value: string | number;
}) {
  const toneClass =
    tone === "profit" ? "text-profit" :
    tone === "loss" ? "text-loss" :
    tone === "withdrawal" ? "text-withdrawal" :
    "text-foreground";

  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`mt-2 font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function buildMonthDays(month: Date, trades: Trade[]) {
  const firstDay = startOfMonth(month);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = formatDate(date);

    return createDaySummary(dateKey, date.getMonth() === month.getMonth(), trades);
  });
}

function createDaySummary(date: string, isCurrentMonth: boolean, trades: Trade[]): DaySummary {
  const dayTrades = trades
    .filter((trade) => trade.date === date)
    .sort((first, second) => first.timestamp - second.timestamp);
  const netProfitLoss = sum(dayTrades.map((trade) => trade.netProfitLoss));

  return {
    date,
    dayNumber: Number(date.slice(-2)),
    isCurrentMonth,
    trades: dayTrades,
    netProfitLoss,
    withdrawals: sum(dayTrades.map((trade) => trade.withdrawalAmount)),
    wins: dayTrades.filter((trade) => trade.status === "Win").length,
    losses: dayTrades.filter((trade) => trade.status === "Loss").length,
    bestTrade: dayTrades.length ? Math.max(...dayTrades.map((trade) => safe(trade.netProfitLoss))) : 0,
    worstTrade: dayTrades.length ? Math.min(...dayTrades.map((trade) => safe(trade.netProfitLoss))) : 0,
  };
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(safe(value));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + safe(value), 0);
}

function safe(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
