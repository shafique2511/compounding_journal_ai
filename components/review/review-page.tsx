"use client";

import Link from "next/link";
import { Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { useEscapeToClose } from "@/hooks/use-escape-to-close";
import { getFriendlyErrorMessage, logTechnicalError } from "@/lib/errors/app-error";
import { saveTrade } from "@/lib/supabase";
import { useJournalStore } from "@/store";
import type { Trade } from "@/types";
import { cn } from "@/lib/utils";

type ReviewFilter =
  | "losing"
  | "rule-broken"
  | "low-quality"
  | "with-mistakes"
  | "without-screenshot"
  | "without-notes"
  | "best"
  | "worst"
  | "reviewed"
  | "unreviewed";

const filterOptions: { label: string; value: ReviewFilter }[] = [
  { label: "Losing trades only", value: "losing" },
  { label: "Rule broken trades only", value: "rule-broken" },
  { label: "Low quality trades only", value: "low-quality" },
  { label: "Trades with mistakes", value: "with-mistakes" },
  { label: "Trades without screenshot", value: "without-screenshot" },
  { label: "Trades without notes", value: "without-notes" },
  { label: "Best trades", value: "best" },
  { label: "Worst trades", value: "worst" },
  { label: "Reviewed trades", value: "reviewed" },
  { label: "Unreviewed trades", value: "unreviewed" },
];

export function ReviewPage() {
  const { user } = useAuth();
  const { setTrades, trades } = useJournalStore();
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>("unreviewed");
  const [showFilters, setShowFilters] = useState(false);
  const [message, setMessage] = useState("");
  useEscapeToClose(showFilters, () => setShowFilters(false));
  const filteredTrades = useMemo(
    () => filterReviewTrades(trades, activeFilter),
    [activeFilter, trades],
  );

  async function updateTradeReview(
    trade: Trade,
    updates: Pick<Trade, "reviewCompleted" | "reviewDate" | "reviewNotes">,
  ) {
    const nextTrade = {
      ...trade,
      ...updates,
      updatedAt: Date.now(),
    };
    const nextTrades = trades.map((item) => (item.id === trade.id ? nextTrade : item));
    setTrades(nextTrades);
    setMessage(`Review updated for trade #${trade.tradeNumber}.`);

    if (user) {
      try {
        await saveTrade(user.id, nextTrade);
      } catch (caughtError) {
        logTechnicalError(caughtError, { action: "save review", source: "database" });
        setMessage(getFriendlyErrorMessage(caughtError, `Review updated locally for trade #${trade.tradeNumber}. Supabase could not sync it.`));
      }
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Review Mode
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Trade Review</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Review past trades, capture lessons, and track completed post-trade analysis.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 md:hidden">
          <div>
            <p className="text-sm font-medium">{filterOptions.find((option) => option.value === activeFilter)?.label}</p>
            <p className="text-xs text-muted-foreground">{filteredTrades.length} trades</p>
          </div>
          <Button onClick={() => setShowFilters(true)} type="button" variant="secondary">Filters</Button>
        </div>
        <div className="hidden gap-2 md:grid md:grid-cols-2 lg:grid-cols-5">
          {filterOptions.map((option) => (
            <button
              className={cn(
                "rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                activeFilter === option.value && "border-primary bg-primary text-primary-foreground hover:bg-primary",
              )}
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredTrades.map((trade) => (
          <ReviewCard key={trade.id} onSave={updateTradeReview} trade={trade} />
        ))}
        {filteredTrades.length === 0 ? (
          <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground shadow-sm">
            No trades match this review filter.
          </div>
        ) : null}
      </div>

      {showFilters ? (
        <div className="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur-sm md:hidden">
          <button aria-label="Close review filters" className="fixed inset-0" onClick={() => setShowFilters(false)} type="button" />
          <div className="relative mx-auto max-h-[calc(100vh-2rem)] max-w-md overflow-y-auto rounded-lg border bg-card p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Review Filters</h3>
              <Button onClick={() => setShowFilters(false)} type="button" variant="secondary">Done</Button>
            </div>
            <div className="grid gap-2">
              {filterOptions.map((option) => (
                <button
                  className={cn(
                    "rounded-md border px-3 py-3 text-left text-sm transition-colors",
                    activeFilter === option.value && "border-primary bg-primary text-primary-foreground",
                  )}
                  key={option.value}
                  onClick={() => {
                    setActiveFilter(option.value);
                    setShowFilters(false);
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ReviewCard({
  onSave,
  trade,
}: {
  onSave: (
    trade: Trade,
    updates: Pick<Trade, "reviewCompleted" | "reviewDate" | "reviewNotes">,
  ) => Promise<void>;
  trade: Trade;
}) {
  const [reviewCompleted, setReviewCompleted] = useState(trade.reviewCompleted);
  const [reviewDate, setReviewDate] = useState(trade.reviewDate || new Date().toISOString().slice(0, 10));
  const [reviewNotes, setReviewNotes] = useState(trade.reviewNotes);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);

    try {
      await onSave(trade, { reviewCompleted, reviewDate, reviewNotes });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Trade #{trade.tradeNumber}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">
            {trade.symbol || "Unknown Symbol"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {trade.date} {trade.time}
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/journal/${trade.id}`}>View Trade</Link>
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label="Net profit/loss"
          tone={trade.netProfitLoss >= 0 ? "profit" : "loss"}
          value={money(trade.netProfitLoss)}
        />
        <Metric label="Rule followed" value={trade.ruleFollowed} />
        <Metric label="Quality score" value={trade.tradeQualityScore} tone="analytics" />
        <Metric label="Quality grade" value={trade.tradeQualityGrade} tone="analytics" />
        <Metric label="Mistake tags" value={trade.mistakeTags.length ? trade.mistakeTags.join(", ") : "-"} />
      </div>

      <div className="mt-4 rounded-lg border bg-background p-4">
        <p className="text-sm font-medium">Lesson learned</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {trade.lessonLearned || "-"}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <label className="flex items-center gap-2 rounded-md border bg-background p-3 text-sm">
            <input
              checked={reviewCompleted}
              className="size-4"
              onChange={(event) => setReviewCompleted(event.target.checked)}
              type="checkbox"
            />
            Mark review as completed
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium">Review date</span>
            <input
              className="h-11 w-full rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm"
              onChange={(event) => setReviewDate(event.target.value)}
              type="date"
              value={reviewDate}
            />
          </label>
        </div>
        <label className="space-y-2">
          <span className="text-sm font-medium">Review notes</span>
          <textarea
            className="min-h-36 w-full rounded-md border bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            onChange={(event) => setReviewNotes(event.target.value)}
            value={reviewNotes}
          />
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <Button className="h-11 w-full md:w-auto" disabled={isSaving} onClick={handleSave} type="button">
          <Save aria-hidden="true" className="size-4" />
          {isSaving ? "Saving..." : "Save Review"}
        </Button>
      </div>
    </article>
  );
}

function Metric({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "analytics" | "loss" | "neutral" | "profit";
  value: string | number;
}) {
  const toneClass =
    tone === "profit" ? "text-profit" :
    tone === "loss" ? "text-loss" :
    tone === "analytics" ? "text-analytics" :
    "text-foreground";

  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function filterReviewTrades(trades: Trade[], filter: ReviewFilter) {
  const sortedTrades = [...trades].sort((first, second) => second.timestamp - first.timestamp);

  if (filter === "losing") {
    return sortedTrades.filter((trade) => trade.status === "Loss" || trade.netProfitLoss < 0);
  }

  if (filter === "rule-broken") {
    return sortedTrades.filter((trade) => trade.ruleFollowed === "No");
  }

  if (filter === "low-quality") {
    return sortedTrades.filter((trade) => trade.tradeQualityScore < 70);
  }

  if (filter === "with-mistakes") {
    return sortedTrades.filter((trade) => trade.mistakeTags.length > 0 || Boolean(trade.mistakeMade));
  }

  if (filter === "without-screenshot") {
    return sortedTrades.filter((trade) => !trade.beforeScreenshotUrl || !trade.afterScreenshotUrl);
  }

  if (filter === "without-notes") {
    return sortedTrades.filter((trade) => !trade.notes.trim());
  }

  if (filter === "best") {
    return [...sortedTrades].sort((first, second) => second.netProfitLoss - first.netProfitLoss).slice(0, 10);
  }

  if (filter === "worst") {
    return [...sortedTrades].sort((first, second) => first.netProfitLoss - second.netProfitLoss).slice(0, 10);
  }

  if (filter === "reviewed") {
    return sortedTrades.filter((trade) => trade.reviewCompleted);
  }

  return sortedTrades.filter((trade) => !trade.reviewCompleted);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(safe(value));
}

function safe(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
