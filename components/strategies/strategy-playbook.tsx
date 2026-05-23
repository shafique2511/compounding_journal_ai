"use client";

import Link from "next/link";
import { Edit, Eye, Plus, Power, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { getFriendlyErrorMessage, logTechnicalError } from "@/lib/errors/app-error";
import { deleteUserDocument, saveStrategy } from "@/lib/supabase";
import { getCurrentTimestamp } from "@/lib/time/timestamp";
import {
  calculateAverageR,
  calculateMaxDrawdown,
  calculateProfitFactor,
  calculateWinRate,
} from "@/lib/calculations";
import { useJournalStore } from "@/store";
import type { Strategy, Trade } from "@/types";
import { cn } from "@/lib/utils";
import { StrategyTemplateLibrary } from "@/components/strategies/strategy-template-library";

export function StrategyPlaybook() {
  const { user } = useAuth();
  const { removeStrategy, strategies, trades, upsertStrategy } = useJournalStore();
  const [strategyToDelete, setStrategyToDelete] = useState<Strategy | null>(null);
  const [message, setMessage] = useState("");

  async function handleToggleStrategy(strategy: Strategy) {
    const nextStrategy = { ...strategy, isActive: !strategy.isActive, updatedAt: getCurrentTimestamp() };
    upsertStrategy(nextStrategy);

    if (user) {
      try {
        await saveStrategy(user.id, nextStrategy);
      } catch (caughtError) {
        logTechnicalError(caughtError, { action: "toggle strategy", source: "database" });
        setMessage(getFriendlyErrorMessage(caughtError, "Strategy updated locally. Supabase could not sync the change."));
      }
    }
  }

  async function confirmDelete() {
    if (!strategyToDelete) {
      return;
    }

    removeStrategy(strategyToDelete.id);

    if (user) {
      try {
        await deleteUserDocument(user.id, "strategies", strategyToDelete.id);
      } catch (caughtError) {
        logTechnicalError(caughtError, { action: "delete strategy", source: "database" });
        setMessage(getFriendlyErrorMessage(caughtError, "Strategy deleted locally. Supabase could not sync the deletion."));
      }
    }

    setStrategyToDelete(null);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Strategy Playbook
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Strategies</h2>
        </div>
        <Button asChild>
          <Link href="/strategies/add">
            <Plus aria-hidden="true" className="size-4" />
            Add Strategy
          </Link>
        </Button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <StrategyTemplateLibrary onMessage={setMessage} />

      <div className="grid gap-4 lg:grid-cols-2">
        {strategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            onDelete={() => setStrategyToDelete(strategy)}
            onToggle={() => handleToggleStrategy(strategy)}
            strategy={strategy}
            trades={getStrategyTrades(strategy, trades)}
          />
        ))}
        {strategies.length === 0 ? (
          <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground shadow-sm">
            No strategies yet.
          </div>
        ) : null}
      </div>

      {strategyToDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-lg">
            <h3 className="text-lg font-semibold">Delete strategy?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Existing trades keep their saved strategy name and will not be deleted.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button onClick={() => setStrategyToDelete(null)} type="button" variant="secondary">
                Cancel
              </Button>
              <Button onClick={confirmDelete} type="button">
                Delete Strategy
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function StrategyDetail({ strategyId }: { strategyId: string }) {
  const { strategies, trades } = useJournalStore();
  const strategy = strategies.find((item) => item.id === strategyId);
  const strategyTrades = useMemo(
    () => (strategy ? getStrategyTrades(strategy, trades) : []),
    [strategy, trades],
  );

  if (!strategy) {
    return (
      <section className="rounded-lg border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        Strategy not found. Trades linked to a deleted strategy still keep their saved strategy name.
      </section>
    );
  }

  const stats = getStrategyStats(strategyTrades);

  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Strategy Detail
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{strategy.strategyName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {strategy.marketType || "Market type not set"} / {strategy.timeframe || "Timeframe not set"}
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href={`/strategies/${strategy.id}/edit`}>Edit Strategy</Link>
          </Button>
        </div>
      </div>

      <MetricsGrid stats={stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RuleBlock label="Entry Rules" value={strategy.entryRules} />
        <RuleBlock label="Exit Rules" value={strategy.exitRules} />
        <RuleBlock label="Stop Loss Rules" value={strategy.stopLossRules} />
        <RuleBlock label="Take Profit Rules" value={strategy.takeProfitRules} />
        <RuleBlock label="Risk Rules" value={strategy.riskRules} />
        <RuleBlock label="Notes" value={strategy.notes} />
      </div>

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight">Example Screenshot</h3>
        <div className="mt-4 grid min-h-64 place-items-center overflow-hidden rounded-md border bg-muted/30">
          {strategy.exampleScreenshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={strategy.strategyName} className="max-h-96 w-full object-contain" src={strategy.exampleScreenshotUrl} />
          ) : (
            <p className="text-sm text-muted-foreground">No example screenshot uploaded.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function StrategyCard({
  onDelete,
  onToggle,
  strategy,
  trades,
}: {
  onDelete: () => void;
  onToggle: () => void;
  strategy: Strategy;
  trades: Trade[];
}) {
  const stats = getStrategyStats(trades);

  return (
    <article className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{strategy.strategyName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {strategy.marketType || "Market type not set"} / {strategy.timeframe || "Timeframe not set"}
          </p>
        </div>
        <span className={cn("rounded-md px-2 py-1 text-xs font-medium", strategy.isActive ? "bg-profit/10 text-profit" : "bg-breakeven/10 text-breakeven")}>
          {strategy.isActive ? "Active" : "Inactive"}
        </span>
      </div>
      <MetricsGrid compact stats={stats} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="icon" variant="ghost">
          <Link aria-label="View strategy" href={`/strategies/${strategy.id}`}>
            <Eye className="size-4" />
          </Link>
        </Button>
        <Button asChild size="icon" variant="ghost">
          <Link aria-label="Edit strategy" href={`/strategies/${strategy.id}/edit`}>
            <Edit className="size-4" />
          </Link>
        </Button>
        <Button aria-label="Activate or deactivate strategy" onClick={onToggle} size="icon" type="button" variant="ghost">
          <Power className="size-4" />
        </Button>
        <Button aria-label="Delete strategy" onClick={onDelete} size="icon" type="button" variant="ghost">
          <Trash2 className="size-4 text-loss" />
        </Button>
      </div>
    </article>
  );
}

function MetricsGrid({ compact = false, stats }: { compact?: boolean; stats: ReturnType<typeof getStrategyStats> }) {
  return (
    <div className={cn("mt-4 grid gap-3", compact ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>
      <Metric label="Total trades" value={stats.totalTrades} />
      <Metric label="Win rate" value={`${stats.winRate.toFixed(2)}%`} tone="profit" />
      <Metric label="Net profit" value={money(stats.netProfit)} tone={stats.netProfit >= 0 ? "profit" : "loss"} />
      <Metric label="Average R" value={stats.averageR.toFixed(2)} tone="analytics" />
      <Metric label="Profit factor" value={formatFinite(stats.profitFactor)} tone="analytics" />
      <Metric label="Max drawdown" value={`${stats.maxDrawdown.toFixed(2)}%`} tone="loss" />
      <Metric label="Best trade" value={money(stats.bestTrade)} tone="profit" />
      <Metric label="Worst trade" value={money(stats.worstTrade)} tone="loss" />
    </div>
  );
}

function RuleBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold tracking-tight">{label}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{value || "-"}</p>
    </div>
  );
}

function Metric({ label, tone = "neutral", value }: { label: string; tone?: "analytics" | "loss" | "neutral" | "profit"; value: string | number }) {
  const toneClass = tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : tone === "analytics" ? "text-analytics" : "text-foreground";
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`mt-2 font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function getStrategyTrades(strategy: Strategy, trades: Trade[]) {
  return trades.filter(
    (trade) =>
      trade.strategyId === strategy.id ||
      (!trade.strategyId && trade.strategyName === strategy.strategyName) ||
      trade.strategyName === strategy.strategyName,
  );
}

function getStrategyStats(trades: Trade[]) {
  return {
    averageR: calculateAverageR(trades),
    bestTrade: max(trades.map((trade) => trade.netProfitLoss)),
    maxDrawdown: calculateMaxDrawdown(trades),
    netProfit: sum(trades.map((trade) => trade.netProfitLoss)),
    profitFactor: calculateProfitFactor(trades),
    totalTrades: trades.length,
    winRate: calculateWinRate(trades),
    worstTrade: min(trades.map((trade) => trade.netProfitLoss)),
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + safe(value), 0);
}

function max(values: number[]) {
  return values.length ? Math.max(...values.map(safe)) : 0;
}

function min(values: number[]) {
  return values.length ? Math.min(...values.map(safe)) : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(safe(value));
}

function formatFinite(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "∞";
}

function safe(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
