"use client";

import Link from "next/link";
import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { deleteUserDocument, listTrades, listUserDocuments, saveTrade } from "@/lib/supabase";
import { applyFilterPresetToTradeFilters } from "@/lib/filters/filter-presets";
import {
  EMPTY_TRADE_FILTERS,
  filterTrades,
  recalculateTradesInSequence,
  sortTrades,
  type TradeFilters,
  type TradeSort,
} from "@/lib/trades/trade-ledger";
import { useJournalStore } from "@/store";
import type { FilterPreset, Trade } from "@/types";
import { cn } from "@/lib/utils";

const timeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"];
const statuses = ["Win", "Loss", "Breakeven", "Running", "Cancelled"];
const qualityGrades = ["A+", "A", "B", "C", "D"];
const ruleStatuses = ["Yes", "No", "Partially"];

export function TradeJournal() {
  const { user } = useAuth();
  const { filterPresets, settings, setFilterPresets, trades, setTrades } = useJournalStore();
  const [filters, setFilters] = useState<TradeFilters>(EMPTY_TRADE_FILTERS);
  const [presetId, setPresetId] = useState("");
  const [sort, setSort] = useState<TradeSort>("newest");
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    listTrades(user.uid)
      .then((remoteTrades) => {
        if (remoteTrades.length > 0) {
          setTrades(recalculateTradesInSequence(remoteTrades, settings.initialBalance));
        }
      })
      .catch(() => undefined);

    listUserDocuments<FilterPreset>(user.uid, "filterPresets")
      .then(setFilterPresets)
      .catch(() => undefined);
  }, [settings.initialBalance, setFilterPresets, setTrades, user]);

  const filteredTrades = useMemo(
    () => sortTrades(filterTrades(trades, filters), sort),
    [filters, sort, trades],
  );
  const symbols = unique(trades.map((trade) => trade.symbol));
  const strategies = unique(trades.map((trade) => trade.strategyName).filter(Boolean));

  function applyPreset(nextPresetId: string) {
    setPresetId(nextPresetId);

    if (!nextPresetId) {
      setFilters(EMPTY_TRADE_FILTERS);
      return;
    }

    setFilters(applyFilterPresetToTradeFilters(filters, filterPresets.find((preset) => preset.id === nextPresetId)));
  }

  async function confirmDelete() {
    if (!tradeToDelete) {
      return;
    }

    const recalculatedTrades = recalculateTradesInSequence(
      trades.filter((trade) => trade.id !== tradeToDelete.id),
      settings.initialBalance,
    );

    setTrades(recalculatedTrades);
    setTradeToDelete(null);
    setMessage("Trade deleted and balances recalculated.");

    if (user) {
      try {
        await deleteUserDocument(user.uid, "trades", tradeToDelete.id);
        await Promise.all(recalculatedTrades.map((trade) => saveTrade(user.uid, trade)));
      } catch {
        setMessage("Trade deleted locally. Supabase could not sync the change.");
      }
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Trade Journal
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Trades</h2>
        </div>
        <Button asChild>
          <Link href="/journal/add">
            <Plus aria-hidden="true" className="size-4" />
            Add Trade
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-5">
          <label className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="Search symbol, strategy, mistakes"
              value={filters.search}
            />
          </label>
          <Input type="date" value={filters.dateFrom} onChange={(value) => setFilters({ ...filters, dateFrom: value })} />
          <Input type="date" value={filters.dateTo} onChange={(value) => setFilters({ ...filters, dateTo: value })} />
          <Select value={filters.symbol} onChange={(value) => setFilters({ ...filters, symbol: value })}>
            <option value="">All symbols</option>
            {symbols.map((symbol) => <option key={symbol}>{symbol}</option>)}
          </Select>
          <Select value={filters.timeframe} onChange={(value) => setFilters({ ...filters, timeframe: value })}>
            <option value="">All timeframes</option>
            {timeframes.map((timeframe) => <option key={timeframe}>{timeframe}</option>)}
          </Select>
          <Select value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}>
            <option value="">All status</option>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </Select>
          <Select value={filters.strategy} onChange={(value) => setFilters({ ...filters, strategy: value })}>
            <option value="">All strategies</option>
            {strategies.map((strategy) => <option key={strategy}>{strategy}</option>)}
          </Select>
          <Select value={filters.qualityGrade} onChange={(value) => setFilters({ ...filters, qualityGrade: value })}>
            <option value="">All grades</option>
            {qualityGrades.map((grade) => <option key={grade}>{grade}</option>)}
          </Select>
          <Select value={filters.ruleFollowed} onChange={(value) => setFilters({ ...filters, ruleFollowed: value })}>
            <option value="">All rule status</option>
            {ruleStatuses.map((rule) => <option key={rule}>{rule}</option>)}
          </Select>
          <Select value={presetId} onChange={applyPreset}>
            <option value="">Saved filter presets</option>
            {filterPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.presetName}</option>
            ))}
          </Select>
          <Select value={sort} onChange={(value) => setSort(value as TradeSort)}>
            <option value="newest">Sort by newest</option>
            <option value="oldest">Sort by oldest</option>
            <option value="highest-profit">Sort by highest profit</option>
            <option value="biggest-loss">Sort by biggest loss</option>
          </Select>
        </div>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <Th>No.</Th><Th>Date / Time</Th><Th>Symbol</Th><Th>Direction</Th><Th>TF</Th><Th>Net P/L</Th><Th>Ending</Th><Th>Status</Th><Th>Mistakes</Th><Th>Rule</Th><Th>Score</Th><Th>Grade</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                <tr className="border-t" key={trade.id}>
                  <Td>{trade.tradeNumber}</Td>
                  <Td>{trade.date} {trade.time}</Td>
                  <Td className="font-medium">{trade.symbol}</Td>
                  <Td>{trade.direction}</Td>
                  <Td>{trade.timeframe}</Td>
                  <Td className={trade.netProfitLoss > 0 ? "text-profit" : trade.netProfitLoss < 0 ? "text-loss" : "text-breakeven"}>{formatMoney(trade.netProfitLoss)}</Td>
                  <Td>{formatMoney(trade.endingBalance)}</Td>
                  <Td><StatusBadge status={trade.status} /></Td>
                  <Td>{trade.mistakeTags.length ? trade.mistakeTags.join(", ") : "-"}</Td>
                  <Td>{trade.ruleFollowed}</Td>
                  <Td>{trade.tradeQualityScore}</Td>
                  <Td>{trade.tradeQualityGrade}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <IconLink href={`/journal/${trade.id}`} label="View"><Eye className="size-4" /></IconLink>
                      <IconLink href={`/journal/${trade.id}/edit`} label="Edit"><Edit className="size-4" /></IconLink>
                      <button className="rounded-md border p-2 text-loss hover:bg-loss/10" onClick={() => setTradeToDelete(trade)} type="button" aria-label="Delete trade"><Trash2 className="size-4" /></button>
                    </div>
                  </Td>
                </tr>
              ))}
              {filteredTrades.length === 0 ? (
                <tr><td className="p-6 text-center text-muted-foreground" colSpan={13}>No trades match the current filters.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {tradeToDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-lg">
            <h3 className="text-lg font-semibold">Delete trade #{tradeToDelete.tradeNumber}?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will delete the trade, reorder trade numbers, and recalculate following balances.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button onClick={() => setTradeToDelete(null)} type="button" variant="secondary">Cancel</Button>
              <Button onClick={confirmDelete} type="button">Delete Trade</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TradeDetailCard({ trade }: { trade: Trade }) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Trade #{trade.tradeNumber}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{trade.symbol} {trade.direction}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{trade.date} {trade.time} - {trade.timeframe}</p>
        </div>
        <Button asChild variant="secondary"><Link href={`/journal/${trade.id}/edit`}>Edit Trade</Link></Button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Net P/L" value={formatMoney(trade.netProfitLoss)} tone={trade.netProfitLoss >= 0 ? "text-profit" : "text-loss"} />
        <Metric label="Ending Balance" value={formatMoney(trade.endingBalance)} />
        <Metric label="Risk Reward" value={String(trade.riskRewardRatio)} />
        <Metric label="Quality" value={`${trade.tradeQualityScore} / ${trade.tradeQualityGrade}`} />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TextBlock label="Mistake Made" value={trade.mistakeMade} />
        <TextBlock label="Lesson Learned" value={trade.lessonLearned} />
        <TextBlock label="Notes" value={trade.notes} />
        <TextBlock label="Review Notes" value={trade.reviewNotes} />
      </div>
    </section>
  );
}

export function TradeDetail({ tradeId }: { tradeId: string }) {
  const trade = useJournalStore((state) => state.trades.find((item) => item.id === tradeId));

  if (!trade) {
    return <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">Trade not found.</div>;
  }

  return <TradeDetailCard trade={trade} />;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-3 font-medium">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-3 align-top", className)}>{children}</td>;
}

function Input({ value, onChange, type = "text" }: { value: string; onChange: (value: string) => void; type?: string }) {
  return <input className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" type={type} value={value} onChange={(event) => onChange(event.target.value)} />;
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <select className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>;
}

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return <Link aria-label={label} className="rounded-md border p-2 hover:bg-accent" href={href}>{children}</Link>;
}

function StatusBadge({ status }: { status: Trade["status"] }) {
  const className = status === "Win" ? "bg-profit/10 text-profit" : status === "Loss" ? "bg-loss/10 text-loss" : status === "Breakeven" ? "bg-breakeven/10 text-breakeven" : "bg-analytics/10 text-analytics";
  return <span className={cn("rounded-md px-2 py-1 text-xs font-medium", className)}>{status}</span>;
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return <div className="rounded-lg border bg-background p-4"><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className={cn("mt-2 text-xl font-semibold", tone)}>{value}</p></div>;
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-background p-4"><p className="text-sm font-medium">{label}</p><p className="mt-2 text-sm text-muted-foreground">{value || "-"}</p></div>;
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
