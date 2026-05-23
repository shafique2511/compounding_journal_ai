"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  calculateAverageR,
  calculateDailyLossUsed,
  calculateMaxDrawdown,
  calculateProfitFactor,
  calculateRuleDisciplineScore,
  calculateWeeklyLossUsed,
  calculateWinRate,
} from "@/lib/calculations";
import { useAuth } from "@/components/auth";
import { listUserDocuments } from "@/lib/supabase";
import { filterTradesByPreset } from "@/lib/filters/filter-presets";
import { useJournalStore } from "@/store";
import type { FilterPreset, Trade } from "@/types";

const timeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"];
const qualityGrades = ["A+", "A", "B", "C", "D"];

export function AnalyticsPage() {
  const { user } = useAuth();
  const { filterPresets, settings, setFilterPresets, trades: allTrades } = useJournalStore();
  const [presetId, setPresetId] = useState("");
  const selectedPreset = filterPresets.find((preset) => preset.id === presetId);
  const trades = useMemo(
    () => filterTradesByPreset(allTrades, selectedPreset),
    [allTrades, selectedPreset],
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    listUserDocuments<FilterPreset>(user.id, "filterPresets")
      .then(setFilterPresets)
      .catch(() => undefined);
  }, [setFilterPresets, user]);

  const wins = trades.filter((trade) => trade.status === "Win");
  const losses = trades.filter((trade) => trade.status === "Loss");
  const breakeven = trades.filter((trade) => trade.status === "Breakeven");
  const profitTrades = trades.filter((trade) => trade.netProfitLoss > 0);
  const losingTrades = trades.filter((trade) => trade.netProfitLoss < 0);
  const checklistPassed = trades.filter((trade) => trade.checklistStatus === "Plan Passed");
  const checklistWarning = trades.filter((trade) => trade.checklistStatus === "Plan Warning");
  const rulesFollowed = trades.filter((trade) => trade.ruleFollowed === "Yes");
  const rulesBroken = trades.filter((trade) => trade.ruleFollowed === "No");
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = startOfWeek(new Date()).getTime();
  const warningsCount = trades.reduce(
    (total, trade) =>
      total +
      (settings.enableRiskWarning &&
      ((settings.maxRiskPerTradePercent > 0 &&
        percentOf(trade.riskAmount, trade.startingBalance) > settings.maxRiskPerTradePercent) ||
        (settings.minimumRiskRewardRatio > 0 &&
          trade.riskRewardRatio < settings.minimumRiskRewardRatio))
        ? 1
        : 0),
    0,
  );
  const mistakeStats = getMistakeStats(trades);
  const mostCommonMistake = mistakeStats[0]?.name ?? "-";
  const mostRepeatedLesson = topRepeatedText(trades.map((trade) => trade.lessonLearned));
  const mostRepeatedMistake = topRepeatedText(trades.map((trade) => trade.mistakeMade));

  return (
    <section className="space-y-5">
      <Header />

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={presetId} onChange={setPresetId}>
            <option value="">All trades</option>
            {filterPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.presetName}</option>
            ))}
          </Select>
          <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground md:col-span-2">
            {presetId ? `${trades.length} trades match the selected preset.` : "No preset applied."}
          </div>
        </div>
      </div>

      <AnalysisSection title="1. Performance Summary">
        <Metric label="Total trades" value={trades.length} />
        <Metric label="Total wins" value={wins.length} tone="profit" />
        <Metric label="Total losses" value={losses.length} tone="loss" />
        <Metric label="Breakeven trades" value={breakeven.length} tone="neutral" />
        <Metric label="Win rate" value={`${calculateWinRate(trades).toFixed(2)}%`} tone="profit" />
        <Metric label="Loss rate" value={`${rate(losses.length, trades.length).toFixed(2)}%`} tone="loss" />
        <Metric label="Net profit" value={money(sum(trades, "netProfitLoss"))} tone={sum(trades, "netProfitLoss") >= 0 ? "profit" : "loss"} />
        <Metric label="Average profit" value={money(average(profitTrades.map((trade) => trade.netProfitLoss)))} tone="profit" />
        <Metric label="Average loss" value={money(average(losingTrades.map((trade) => trade.netProfitLoss)))} tone="loss" />
        <Metric label="Profit factor" value={formatFinite(calculateProfitFactor(trades))} tone="analytics" />
      </AnalysisSection>

      <AnalysisSection title="2. Risk Analysis">
        <Metric label="Average risk per trade" value={money(average(trades.map((trade) => trade.riskAmount)))} tone="withdrawal" />
        <Metric label="Average R multiple" value={calculateAverageR(trades).toFixed(2)} tone="analytics" />
        <Metric label="Best R" value={max(trades.map((trade) => trade.rMultiple)).toFixed(2)} tone="profit" />
        <Metric label="Worst R" value={min(trades.map((trade) => trade.rMultiple)).toFixed(2)} tone="loss" />
        <Metric label="Maximum drawdown" value={`${calculateMaxDrawdown(trades).toFixed(2)}%`} tone="loss" />
        <Metric label="Risk warnings count" value={warningsCount} tone={warningsCount > 0 ? "withdrawal" : "profit"} />
        <Metric label="Daily loss used" value={money(calculateDailyLossUsed(trades, today))} tone="loss" />
        <Metric label="Weekly loss used" value={money(calculateWeeklyLossUsed(trades, weekStart))} tone="loss" />
      </AnalysisSection>

      <AnalysisSection title="3. Checklist Analysis">
        <Metric label="Average checklist score" value={`${average(trades.map((trade) => trade.checklistScore)).toFixed(2)}%`} tone="analytics" />
        <Metric label="Plan passed count" value={checklistPassed.length} tone="profit" />
        <Metric label="Plan warning count" value={checklistWarning.length} tone="withdrawal" />
        <Metric label="Win rate when checklist passed" value={`${calculateWinRate(checklistPassed).toFixed(2)}%`} tone="profit" />
        <Metric label="Win rate when checklist warning" value={`${calculateWinRate(checklistWarning).toFixed(2)}%`} tone="withdrawal" />
        <Metric label="Net profit by checklist status" value={`Passed ${money(sum(checklistPassed, "netProfitLoss"))} / Warning ${money(sum(checklistWarning, "netProfitLoss"))}`} tone="analytics" />
      </AnalysisSection>

      <AnalysisSection title="4. Rule Discipline Analysis">
        <Metric label="Win rate when rules followed" value={`${calculateWinRate(rulesFollowed).toFixed(2)}%`} tone="profit" />
        <Metric label="Win rate when rules broken" value={`${calculateWinRate(rulesBroken).toFixed(2)}%`} tone="loss" />
        <Metric label="Net profit when rules followed" value={money(sum(rulesFollowed, "netProfitLoss"))} tone="profit" />
        <Metric label="Net profit when rules broken" value={money(sum(rulesBroken, "netProfitLoss"))} tone="loss" />
        <Metric label="Rules broken trades" value={rulesBroken.length} tone="loss" />
        <Metric label="Rule Discipline Score" value={`${calculateRuleDisciplineScore(trades).toFixed(2)}%`} tone="analytics" />
      </AnalysisSection>

      <TableSection
        columns={["Grade", "Trades", "Win Rate", "Net Profit"]}
        rows={qualityGrades.map((grade) => {
          const gradeTrades = trades.filter((trade) => trade.tradeQualityGrade === grade);
          return [grade, gradeTrades.length, `${calculateWinRate(gradeTrades).toFixed(2)}%`, money(sum(gradeTrades, "netProfitLoss"))];
        })}
        summary={[
          ["Average trade quality score", average(trades.map((trade) => trade.tradeQualityScore)).toFixed(2)],
          ["Quality grade distribution", qualityGrades.map((grade) => `${grade}: ${trades.filter((trade) => trade.tradeQualityGrade === grade).length}`).join(" / ") || "-"],
        ]}
        title="5. Trade Quality Analysis"
      />

      <TableSection
        columns={["Mistake Tag", "Count", "Net P/L", "Win Rate"]}
        rows={mistakeStats.map((stat) => [stat.name, stat.count, money(stat.netProfitLoss), `${stat.winRate.toFixed(2)}%`])}
        summary={[["Most common mistake tag", mostCommonMistake]]}
        title="6. Mistake Tag Analysis"
      />

      <TableSection
        columns={["Timeframe", "Trades", "Win Rate", "Net Profit", "Average R"]}
        rows={timeframes.map((timeframe) => performanceRow(timeframe, trades.filter((trade) => trade.timeframe === timeframe)))}
        title="7. Timeframe Analysis"
      />

      <TableSection
        columns={["Symbol", "Trades", "Win Rate", "Net Profit", "Average R"]}
        rows={unique(trades.map((trade) => trade.symbol)).map((symbol) => performanceRow(symbol, trades.filter((trade) => trade.symbol === symbol)))}
        title="8. Symbol Analysis"
      />

      <TableSection
        columns={["Strategy", "Trades", "Win Rate", "Net Profit", "Average R", "Profit Factor", "Max Drawdown", "Best Trade", "Worst Trade"]}
        rows={unique(trades.map((trade) => trade.strategyName || "Unassigned")).map((strategy) => {
          const strategyTrades = trades.filter((trade) => (trade.strategyName || "Unassigned") === strategy);
          return [
            strategy,
            strategyTrades.length,
            `${calculateWinRate(strategyTrades).toFixed(2)}%`,
            money(sum(strategyTrades, "netProfitLoss")),
            calculateAverageR(strategyTrades).toFixed(2),
            formatFinite(calculateProfitFactor(strategyTrades)),
            `${calculateMaxDrawdown(strategyTrades).toFixed(2)}%`,
            money(max(strategyTrades.map((trade) => trade.netProfitLoss))),
            money(min(strategyTrades.map((trade) => trade.netProfitLoss))),
          ];
        })}
        title="9. Strategy Analysis"
      />

      <TableSection
        columns={["Month", "Net Profit", "Trades", "Win Rate", "Withdrawals"]}
        rows={unique(trades.map((trade) => trade.date.slice(0, 7))).map((month) => {
          const monthTrades = trades.filter((trade) => trade.date.startsWith(month));
          return [
            month,
            money(sum(monthTrades, "netProfitLoss")),
            monthTrades.length,
            `${calculateWinRate(monthTrades).toFixed(2)}%`,
            money(sum(monthTrades, "withdrawalAmount")),
          ];
        })}
        title="10. Monthly Analysis"
      />

      <AnalysisSection title="11. Review Analysis">
        <Metric label="Reviewed trades count" value={trades.filter((trade) => trade.reviewCompleted).length} tone="profit" />
        <Metric label="Unreviewed losing trades count" value={trades.filter((trade) => trade.status === "Loss" && !trade.reviewCompleted).length} tone="loss" />
        <Metric label="Most repeated lesson" value={mostRepeatedLesson} tone="analytics" />
        <Metric label="Most repeated mistake" value={mostRepeatedMistake} tone="withdrawal" />
      </AnalysisSection>
    </section>
  );
}

function Select({
  children,
  onChange,
  value,
}: {
  children: React.ReactNode;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <select
      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {children}
    </select>
  );
}

function Header() {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Analytics
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Deep Trading Analysis</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Review performance, risk, discipline, quality, mistakes, timeframes, symbols, strategies, months, and trade reviews.
      </p>
    </div>
  );
}

function AnalysisSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function TableSection({
  columns,
  rows,
  summary = [],
  title,
}: {
  columns: string[];
  rows: (string | number)[][];
  summary?: (string | number)[][];
  title: string;
}) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {summary.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {summary.map(([label, value]) => (
            <Metric key={String(label)} label={String(label)} value={value} tone="analytics" />
          ))}
        </div>
      ) : null}
      <div className="mt-4 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th className="px-3 py-3 font-medium" key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((row, index) => (
              <tr className="border-t" key={`${row[0]}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td className="px-3 py-3" key={`${cell}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            )) : (
              <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={columns.length}>No data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "analytics" | "loss" | "neutral" | "profit" | "withdrawal";
  value: string | number;
}) {
  const toneClass =
    tone === "profit" ? "text-profit" :
    tone === "loss" ? "text-loss" :
    tone === "withdrawal" ? "text-withdrawal" :
    tone === "analytics" ? "text-analytics" :
    "text-foreground";

  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function performanceRow(label: string, trades: Trade[]) {
  return [
    label,
    trades.length,
    `${calculateWinRate(trades).toFixed(2)}%`,
    money(sum(trades, "netProfitLoss")),
    calculateAverageR(trades).toFixed(2),
  ];
}

function getMistakeStats(trades: Trade[]) {
  const stats = new Map<string, { count: number; netProfitLoss: number; trades: Trade[] }>();

  trades.forEach((trade) => {
    trade.mistakeTags.forEach((tag) => {
      const current = stats.get(tag) ?? { count: 0, netProfitLoss: 0, trades: [] };
      current.count += 1;
      current.netProfitLoss += trade.netProfitLoss;
      current.trades.push(trade);
      stats.set(tag, current);
    });
  });

  return Array.from(stats, ([name, value]) => ({
    name,
    count: value.count,
    netProfitLoss: value.netProfitLoss,
    winRate: calculateWinRate(value.trades),
  })).sort((first, second) => second.count - first.count);
}

function topRepeatedText(values: string[]) {
  const counts = new Map<string, number>();
  values.map((value) => value.trim()).filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts).sort((first, second) => second[1] - first[1])[0]?.[0] ?? "-";
}

function percentOf(value: number, base: number) {
  return base > 0 ? (value / base) * 100 : 0;
}

function sum(trades: Trade[], key: keyof Trade) {
  return trades.reduce((total, trade) => total + safe(trade[key]), 0);
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + safe(value), 0) / values.length : 0;
}

function max(values: number[]) {
  return values.length ? Math.max(...values.map(safe)) : 0;
}

function min(values: number[]) {
  return values.length ? Math.min(...values.map(safe)) : 0;
}

function rate(count: number, total: number) {
  return total > 0 ? (count / total) * 100 : 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(safe(value));
}

function formatFinite(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "∞";
}

function startOfWeek(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function safe(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
