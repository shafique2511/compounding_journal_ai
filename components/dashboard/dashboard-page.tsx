"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateAverageR,
  calculateCumulativeProfit,
  calculateDailyLossUsed,
  calculateDrawdownSeries,
  calculateEquityCurve,
  calculateLossRate,
  calculateMaxDrawdown,
  calculateMistakeTagStats,
  calculateProfitFactor,
  calculateQualityGradeStats,
  calculateRiskRuleWarnings,
  calculateRuleDisciplineScore,
  calculateStreaks,
  calculateStrategyStats,
  calculateWeeklyLossUsed,
  calculateWinRate,
} from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { useEscapeToClose } from "@/hooks/use-escape-to-close";
import { listUserDocuments } from "@/lib/supabase";
import { applyFilterPresetToDashboardFilters } from "@/lib/filters/filter-presets";
import { useJournalStore } from "@/store";
import type { FilterPreset, Trade } from "@/types";
import { cn } from "@/lib/utils";

type DashboardRange = "all" | "today" | "week" | "month" | "year" | "custom";

type DashboardFilters = {
  range: DashboardRange;
  customFrom: string;
  customTo: string;
  symbol: string;
  timeframe: string;
  strategy: string;
  status: string;
  qualityGrade: string;
  ruleFollowed: string;
  preset: string;
};

const defaultFilters: DashboardFilters = {
  range: "all",
  customFrom: "",
  customTo: "",
  symbol: "",
  timeframe: "",
  strategy: "",
  status: "",
  qualityGrade: "",
  ruleFollowed: "",
  preset: "",
};

const chartColors = ["#22c55e", "#ef4444", "#f97316", "#8b5cf6", "#64748b", "#3b82f6"];

export function DashboardPage() {
  const { user } = useAuth();
  const { filterPresets, settings, setFilterPresets, trades } = useJournalStore();
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  useEscapeToClose(showMobileFilters, () => setShowMobileFilters(false));

  useEffect(() => {
    if (!user) {
      return;
    }

    listUserDocuments<FilterPreset>(user.id, "filterPresets")
      .then(setFilterPresets)
      .catch(() => undefined);
  }, [setFilterPresets, user]);

  function applyPreset(nextPresetId: string) {
    if (!nextPresetId) {
      setFilters(defaultFilters);
      return;
    }

    setFilters(applyFilterPresetToDashboardFilters(
      filters,
      filterPresets.find((preset) => preset.id === nextPresetId),
    ));
  }

  function clearFilters() {
    setFilters(defaultFilters);
  }

  const filteredTrades = useMemo(
    () => filterDashboardTrades(trades, filters),
    [filters, trades],
  );
  const sortedTrades = useMemo(
    () => [...filteredTrades].sort((first, second) => first.timestamp - second.timestamp),
    [filteredTrades],
  );
  const symbols = unique(trades.map((trade) => trade.symbol));
  const timeframes = unique(trades.map((trade) => trade.timeframe));
  const strategies = unique(trades.map((trade) => trade.strategyName).filter(Boolean));
  const statuses = unique(trades.map((trade) => trade.status));
  const grades = ["A+", "A", "B", "C", "D"];
  const ruleStatuses = ["Yes", "No", "Partially"];

  const kpis = useMemo(() => {
    const totalNetProfit = calculateCumulativeProfit(filteredTrades);
    const totalWithdrawals = sum(filteredTrades, "withdrawalAmount");
    const currentBalance =
      sortedTrades.at(-1)?.endingBalance ?? settings.initialBalance + totalNetProfit - totalWithdrawals;
    const bestTrade = maxBy(filteredTrades, "netProfitLoss")?.netProfitLoss ?? 0;
    const worstTrade = minBy(filteredTrades, "netProfitLoss")?.netProfitLoss ?? 0;
    const streaks = calculateStreaks(filteredTrades);
    const averageQuality = average(filteredTrades.map((trade) => trade.tradeQualityScore));
    const averageRisk = average(filteredTrades.map((trade) => trade.riskAmount));
    const today = new Date().toISOString().slice(0, 10);
    const weekStart = startOfWeek(new Date()).getTime();
    const latestTrade = sortedTrades.at(-1);
    const warnings = latestTrade
      ? calculateRiskRuleWarnings(latestTrade, settings)
      : [];

    return [
      card("Current Balance", money(currentBalance), currentBalance >= settings.initialBalance ? "profit" : "loss"),
      card("Total Net Profit", money(totalNetProfit), totalNetProfit >= 0 ? "profit" : "loss"),
      card("Total Withdrawals", money(totalWithdrawals), "withdrawal"),
      card("Total Trades", String(filteredTrades.length), "neutral"),
      card("Win Rate", `${calculateWinRate(filteredTrades).toFixed(2)}%`, "profit"),
      card("Loss Rate", `${calculateLossRate(filteredTrades).toFixed(2)}%`, "loss"),
      card("Average R Multiple", calculateAverageR(filteredTrades).toFixed(2), "analytics"),
      card("Best Trade", money(bestTrade), "profit"),
      card("Worst Trade", money(worstTrade), "loss"),
      card("Profit Factor", formatFinite(calculateProfitFactor(filteredTrades)), "analytics"),
      card("Maximum Drawdown", `${calculateMaxDrawdown(filteredTrades).toFixed(2)}%`, "loss"),
      card("Current Streak", formatCurrentStreak(streaks.currentWinStreak, streaks.currentLossStreak), "neutral"),
      card("Longest Win Streak", String(streaks.maxWinStreak), "profit"),
      card("Longest Loss Streak", String(streaks.maxLossStreak), "loss"),
      card("Rule Discipline Score", `${calculateRuleDisciplineScore(filteredTrades).toFixed(2)}%`, "analytics"),
      card("Average Trade Quality Score", averageQuality.toFixed(2), "analytics"),
      card("Risk Per Trade", money(averageRisk), "withdrawal"),
      card("Daily Loss Used", money(calculateDailyLossUsed(filteredTrades, today)), "loss"),
      card("Weekly Loss Used", money(calculateWeeklyLossUsed(filteredTrades, weekStart)), "loss"),
      card("Risk Rule Warnings", warnings.length ? warnings.join(" ") : "None", warnings.length ? "withdrawal" : "profit"),
    ];
  }, [filteredTrades, settings, sortedTrades]);

  const chartData = useMemo(() => buildChartData(sortedTrades), [sortedTrades]);

  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Dashboard
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Performance Overview</h2>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:hidden">
          <Button onClick={() => setShowMobileFilters(true)} type="button" variant="secondary">Open Filters</Button>
          <ActiveFilterChips filters={filters} onClear={clearFilters} />
        </div>
        <div className="hidden md:block">
          <FilterControls
            applyPreset={applyPreset}
            filterPresets={filterPresets}
            filters={filters}
            grades={grades}
            onClear={clearFilters}
            setFilters={setFilters}
            statuses={statuses}
            strategies={strategies}
            symbols={symbols}
            timeframes={timeframes}
            ruleStatuses={ruleStatuses}
          />
        </div>
      </div>

      <div className="grid gap-3 min-[375px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Balance Growth Chart" data={chartData.balance} type="area" dataKey="balance" />
        <ChartCard title="Equity Curve Chart" data={chartData.equity} type="line" dataKey="equity" />
        <ChartCard title="Drawdown Chart" data={chartData.drawdown} type="area" dataKey="drawdownPercent" tone="loss" />
        <ChartCard title="Cumulative Profit Chart" data={chartData.cumulativeProfit} type="line" dataKey="profit" />
        <ChartCard title="Profit/Loss Bar Chart" data={chartData.profitLoss} type="bar" dataKey="netProfitLoss" />
        <PieChartCard title="Win/Loss Pie Chart" data={chartData.winLoss} />
        <ChartCard title="Timeframe Performance Chart" data={chartData.timeframes} type="bar" dataKey="netProfitLoss" />
        <ChartCard title="Symbol Performance Chart" data={chartData.symbols} type="bar" dataKey="netProfitLoss" />
        <ChartCard title="Strategy Performance Chart" data={chartData.strategies} type="bar" dataKey="netProfitLoss" />
        <ChartCard title="Monthly Profit Chart" data={chartData.monthlyProfit} type="bar" dataKey="netProfitLoss" />
        <ChartCard title="R Multiple Distribution Chart" data={chartData.rDistribution} type="bar" dataKey="count" />
        <ChartCard title="Withdrawal History Chart" data={chartData.withdrawals} type="bar" dataKey="withdrawalAmount" tone="withdrawal" />
        <ChartCard title="Mistake Tag Chart" data={chartData.mistakes} type="bar" dataKey="count" tone="loss" />
        <ChartCard title="Quality Grade Chart" data={chartData.qualityGrades} type="bar" dataKey="count" tone="analytics" />
      </div>

      {showMobileFilters ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm md:hidden">
          <button aria-label="Close filters" className="fixed inset-0" onClick={() => setShowMobileFilters(false)} type="button" />
          <div className="relative mx-auto max-h-[calc(100vh-2rem)] max-w-md overflow-y-auto rounded-lg border bg-card p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Dashboard Filters</h3>
              <Button onClick={() => setShowMobileFilters(false)} type="button" variant="secondary">Done</Button>
            </div>
            <FilterControls
              applyPreset={applyPreset}
              filterPresets={filterPresets}
              filters={filters}
              grades={grades}
              onClear={clearFilters}
              setFilters={setFilters}
              statuses={statuses}
              strategies={strategies}
              symbols={symbols}
              timeframes={timeframes}
              ruleStatuses={ruleStatuses}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FilterControls({
  applyPreset,
  filterPresets,
  filters,
  grades,
  onClear,
  ruleStatuses,
  setFilters,
  statuses,
  strategies,
  symbols,
  timeframes,
}: {
  applyPreset: (presetId: string) => void;
  filterPresets: FilterPreset[];
  filters: DashboardFilters;
  grades: string[];
  onClear: () => void;
  ruleStatuses: string[];
  setFilters: (filters: DashboardFilters) => void;
  statuses: string[];
  strategies: string[];
  symbols: string[];
  timeframes: string[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-6">
      <Select value={filters.range} onChange={(value) => setFilters({ ...filters, range: value as DashboardRange })}>
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
        <option value="custom">Custom Date Range</option>
      </Select>
      <Input type="date" value={filters.customFrom} onChange={(value) => setFilters({ ...filters, customFrom: value, range: "custom" })} />
      <Input type="date" value={filters.customTo} onChange={(value) => setFilters({ ...filters, customTo: value, range: "custom" })} />
      <Select value={filters.symbol} onChange={(value) => setFilters({ ...filters, symbol: value })}>
        <option value="">Symbol</option>
        {symbols.map((symbol) => <option key={symbol}>{symbol}</option>)}
      </Select>
      <Select value={filters.timeframe} onChange={(value) => setFilters({ ...filters, timeframe: value })}>
        <option value="">Timeframe</option>
        {timeframes.map((timeframe) => <option key={timeframe}>{timeframe}</option>)}
      </Select>
      <Select value={filters.strategy} onChange={(value) => setFilters({ ...filters, strategy: value })}>
        <option value="">Strategy</option>
        {strategies.map((strategy) => <option key={strategy}>{strategy}</option>)}
      </Select>
      <Select value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}>
        <option value="">Status</option>
        {statuses.map((status) => <option key={status}>{status}</option>)}
      </Select>
      <Select value={filters.qualityGrade} onChange={(value) => setFilters({ ...filters, qualityGrade: value })}>
        <option value="">Quality Grade</option>
        {grades.map((grade) => <option key={grade}>{grade}</option>)}
      </Select>
      <Select value={filters.ruleFollowed} onChange={(value) => setFilters({ ...filters, ruleFollowed: value })}>
        <option value="">Rule Followed</option>
        {ruleStatuses.map((rule) => <option key={rule}>{rule}</option>)}
      </Select>
      <Select value={filters.preset} onChange={applyPreset}>
        <option value="">Saved Filter Presets</option>
        {filterPresets.map((preset) => (
          <option key={preset.id} value={preset.id}>{preset.presetName}</option>
        ))}
      </Select>
      <Button onClick={onClear} type="button" variant="secondary">Clear Filters</Button>
    </div>
  );
}

function ActiveFilterChips({ filters, onClear }: { filters: DashboardFilters; onClear: () => void }) {
  const chips = Object.entries(filters)
    .filter(([key, value]) => key !== "preset" && Boolean(value) && value !== "all")
    .map(([key, value]) => `${labelize(key)}: ${value}`);

  if (chips.length === 0) {
    return <p className="text-sm text-muted-foreground">No active filters.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground" key={chip}>{chip}</span>
      ))}
      <Button onClick={onClear} type="button" variant="ghost">Clear</Button>
    </div>
  );
}

function ChartCard({
  data,
  dataKey,
  title,
  tone = "analytics",
  type,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  title: string;
  tone?: "analytics" | "loss" | "withdrawal";
  type: "area" | "bar" | "line";
}) {
  const color = tone === "loss" ? "#ef4444" : tone === "withdrawal" ? "#f97316" : "#8b5cf6";

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <div className="mt-4 h-60 min-[375px]:h-72 md:h-80 xl:h-96">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            {type === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line dataKey={dataKey} dot={data.length === 1} stroke={color} strokeWidth={2} type="monotone" />
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area dataKey={dataKey} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} type="monotone" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function PieChartCard({ data, title }: { data: { name: string; value: number }[]; title: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <div className="mt-4 h-60 min-[375px]:h-72 md:h-80 xl:h-96">
        {data.every((item) => item.value === 0) ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Tooltip />
              <Pie data={data} dataKey="value" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell fill={chartColors[index % chartColors.length]} key={entry.name} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, tone, value }: { label: string; tone: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("mt-2 break-words text-lg font-semibold min-[375px]:text-xl", toneClass(tone))}>{value}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-full place-items-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
      No data yet
    </div>
  );
}

function Input({ value, onChange, type = "text" }: { value: string; onChange: (value: string) => void; type?: string }) {
  return <input className="h-11 w-full rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm" type={type} value={value} onChange={(event) => onChange(event.target.value)} />;
}

function Select({ children, value, onChange }: { children: React.ReactNode; value: string; onChange: (value: string) => void }) {
  return <select className="h-11 w-full rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>;
}

function buildChartData(trades: Trade[]) {
  let cumulativeProfit = 0;
  const equity = calculateEquityCurve(trades).map((point) => ({
    name: `#${point.tradeNumber}`,
    equity: point.equity,
  }));
  const drawdown = calculateDrawdownSeries(trades).map((point) => ({
    name: `#${point.tradeNumber}`,
    drawdownPercent: point.drawdownPercent,
  }));
  const cumulativeProfitData = trades.map((trade) => {
    cumulativeProfit += trade.netProfitLoss;
    return { name: `#${trade.tradeNumber}`, profit: round(cumulativeProfit) };
  });

  return {
    balance: trades.map((trade) => ({ name: `#${trade.tradeNumber}`, balance: trade.endingBalance })),
    cumulativeProfit: cumulativeProfitData,
    drawdown,
    equity,
    mistakes: objectToRows(calculateMistakeTagStats(trades), "count"),
    monthlyProfit: groupedSum(trades, (trade) => trade.date.slice(0, 7)),
    profitLoss: trades.map((trade) => ({ name: `#${trade.tradeNumber}`, netProfitLoss: trade.netProfitLoss })),
    qualityGrades: objectToRows(calculateQualityGradeStats(trades), "count"),
    rDistribution: groupedCount(trades, (trade) => `${Math.floor(trade.rMultiple)}R`),
    strategies: Object.entries(calculateStrategyStats(trades)).map(([name, value]) => ({
      name,
      netProfitLoss: value.netProfitLoss,
    })),
    symbols: groupedSum(trades, (trade) => trade.symbol),
    timeframes: groupedSum(trades, (trade) => trade.timeframe),
    winLoss: [
      { name: "Win", value: trades.filter((trade) => trade.status === "Win").length },
      { name: "Loss", value: trades.filter((trade) => trade.status === "Loss").length },
      { name: "Breakeven", value: trades.filter((trade) => trade.status === "Breakeven").length },
      { name: "Running", value: trades.filter((trade) => trade.status === "Running").length },
    ],
    withdrawals: trades
      .filter((trade) => trade.withdrawalAmount > 0)
      .map((trade) => ({ name: `#${trade.tradeNumber}`, withdrawalAmount: trade.withdrawalAmount })),
  };
}

function filterDashboardTrades(trades: Trade[], filters: DashboardFilters) {
  const { from, to } = getRange(filters);

  return trades.filter((trade) => {
    const tradeDate = parseDate(trade.date);
    return (
      (!from || tradeDate >= from) &&
      (!to || tradeDate <= to) &&
      (!filters.symbol || trade.symbol === filters.symbol) &&
      (!filters.timeframe || trade.timeframe === filters.timeframe) &&
      (!filters.strategy || trade.strategyName === filters.strategy) &&
      (!filters.status || trade.status === filters.status) &&
      (!filters.qualityGrade || trade.tradeQualityGrade === filters.qualityGrade) &&
      (!filters.ruleFollowed || trade.ruleFollowed === filters.ruleFollowed)
    );
  });
}

function getRange(filters: DashboardFilters) {
  const now = new Date();

  if (filters.range === "today") {
    return { from: startOfDay(now), to: endOfDay(now) };
  }

  if (filters.range === "week") {
    return { from: startOfWeek(now), to: endOfDay(now) };
  }

  if (filters.range === "month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
  }

  if (filters.range === "year") {
    return { from: new Date(now.getFullYear(), 0, 1), to: endOfDay(now) };
  }

  if (filters.range === "custom") {
    return {
      from: filters.customFrom ? parseDate(filters.customFrom) : null,
      to: filters.customTo ? endOfDay(parseDate(filters.customTo)) : null,
    };
  }

  return { from: null, to: null };
}

function groupedSum(trades: Trade[], keyFn: (trade: Trade) => string) {
  const rows = new Map<string, number>();
  trades.forEach((trade) => rows.set(keyFn(trade), (rows.get(keyFn(trade)) ?? 0) + trade.netProfitLoss));
  return Array.from(rows, ([name, netProfitLoss]) => ({ name, netProfitLoss: round(netProfitLoss) }));
}

function groupedCount(trades: Trade[], keyFn: (trade: Trade) => string) {
  const rows = new Map<string, number>();
  trades.forEach((trade) => rows.set(keyFn(trade), (rows.get(keyFn(trade)) ?? 0) + 1));
  return Array.from(rows, ([name, count]) => ({ name, count }));
}

function objectToRows(record: Record<string, number>, valueKey: string) {
  return Object.entries(record).map(([name, value]) => ({ name, [valueKey]: value }));
}

function card(label: string, value: string, tone: string) {
  return { label, value, tone };
}

function toneClass(tone: string) {
  if (tone === "profit") return "text-profit";
  if (tone === "loss") return "text-loss";
  if (tone === "withdrawal") return "text-withdrawal";
  if (tone === "analytics") return "text-analytics";
  return "text-foreground";
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(safe(value));
}

function sum(trades: Trade[], key: keyof Trade) {
  return trades.reduce((total, trade) => total + safe(trade[key]), 0);
}

function average(values: number[]) {
  return values.length ? round(values.reduce((total, value) => total + safe(value), 0) / values.length) : 0;
}

function maxBy(trades: Trade[], key: keyof Trade) {
  return trades.reduce<Trade | undefined>((best, trade) => (!best || safe(trade[key]) > safe(best[key]) ? trade : best), undefined);
}

function minBy(trades: Trade[], key: keyof Trade) {
  return trades.reduce<Trade | undefined>((worst, trade) => (!worst || safe(trade[key]) < safe(worst[key]) ? trade : worst), undefined);
}

function formatFinite(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "∞";
}

function formatCurrentStreak(winStreak: number, lossStreak: number) {
  if (winStreak > 0) return `${winStreak}W`;
  if (lossStreak > 0) return `${lossStreak}L`;
  return "0";
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfWeek(date: Date) {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year || 1970, (month || 1) - 1, day || 1);
}

function safe(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
