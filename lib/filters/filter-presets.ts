import type { FilterPreset, Trade } from "@/types";
import type { TradeFilters } from "@/lib/trades/trade-ledger";

export type PresetDateRange = {
  dateFrom: string;
  dateTo: string;
};

type DashboardPresetFilters = {
  range: string;
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

export function applyFilterPresetToTradeFilters(
  filters: TradeFilters,
  preset?: FilterPreset,
): TradeFilters {
  if (!preset) {
    return filters;
  }

  const dateRange = getPresetDateRange(preset.dateFilter);

  return {
    ...filters,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    symbol: preset.symbolFilter || "",
    timeframe: preset.timeframeFilter || "",
    status: preset.statusFilter || "",
    strategy: preset.strategyFilter || "",
    qualityGrade: preset.qualityGradeFilter || "",
    ruleFollowed: preset.ruleFollowedFilter || "",
  };
}

export function applyFilterPresetToDashboardFilters<T extends DashboardPresetFilters>(
  filters: T,
  preset?: FilterPreset,
): T {
  if (!preset) {
    return { ...filters, preset: "" };
  }

  const dateRange = getPresetDateRange(preset.dateFilter);

  return {
    ...filters,
    range: getDashboardRange(preset.dateFilter),
    customFrom: dateRange.dateFrom,
    customTo: dateRange.dateTo,
    symbol: preset.symbolFilter || "",
    timeframe: preset.timeframeFilter || "",
    strategy: preset.strategyFilter || "",
    status: preset.statusFilter || "",
    qualityGrade: preset.qualityGradeFilter || "",
    ruleFollowed: preset.ruleFollowedFilter || "",
    preset: preset.id,
  };
}

export function filterTradesByPreset(trades: Trade[], preset?: FilterPreset) {
  if (!preset) {
    return trades;
  }

  const dateRange = getPresetDateRange(preset.dateFilter);

  return trades.filter((trade) => {
    const strategyName = trade.strategyName || "";

    return (
      (!dateRange.dateFrom || trade.date >= dateRange.dateFrom) &&
      (!dateRange.dateTo || trade.date <= dateRange.dateTo) &&
      (!preset.symbolFilter || trade.symbol === preset.symbolFilter) &&
      (!preset.timeframeFilter || trade.timeframe === preset.timeframeFilter) &&
      (!preset.strategyFilter || strategyName === preset.strategyFilter) &&
      (!preset.statusFilter || trade.status === preset.statusFilter) &&
      (!preset.qualityGradeFilter || trade.tradeQualityGrade === preset.qualityGradeFilter) &&
      (!preset.ruleFollowedFilter || trade.ruleFollowed === preset.ruleFollowedFilter)
    );
  });
}

export function getPresetDateRange(dateFilter: string): PresetDateRange {
  const normalized = dateFilter.trim().toLowerCase();
  const now = new Date();
  const today = formatDate(now);

  if (!normalized || normalized === "all") {
    return { dateFrom: "", dateTo: "" };
  }

  if (normalized === "today") {
    return { dateFrom: today, dateTo: today };
  }

  if (normalized === "this-week" || normalized === "week") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - start.getDay());
    return { dateFrom: formatDate(start), dateTo: today };
  }

  if (normalized === "this-month" || normalized === "month") {
    return { dateFrom: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)), dateTo: today };
  }

  if (normalized === "this-year" || normalized === "year") {
    return { dateFrom: formatDate(new Date(now.getFullYear(), 0, 1)), dateTo: today };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return { dateFrom: normalized, dateTo: normalized };
  }

  return { dateFrom: "", dateTo: "" };
}

function getDashboardRange(dateFilter: string) {
  const normalized = dateFilter.trim().toLowerCase();

  if (normalized === "today") return "today";
  if (normalized === "this-week" || normalized === "week") return "week";
  if (normalized === "this-month" || normalized === "month") return "month";
  if (normalized === "this-year" || normalized === "year") return "year";
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return "custom";

  return "all";
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
