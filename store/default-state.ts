import type { AppSettings, JournalState } from "@/types";

export const DEFAULT_SETTINGS: AppSettings = {
  initialBalance: 10_000,
  currency: "USD",
  timezoneOffset: "UTC+00:00",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24-hour",
  autoTradeNumber: true,
  defaultTimeframe: "M15",
  defaultSymbol: "",
  defaultCommission: 0,
  defaultSwap: 0,
  themeMode: "system",
  accentColor: "#2563eb",
  aiProvider: "openai",
  aiModel: "gpt-4.1-mini",
  enableScreenshotAnalysis: true,
  saveAiAnalysisHistory: true,
  maxRiskPerTradePercent: 2,
  maxDailyLossPercent: 5,
  maxWeeklyLossPercent: 10,
  maxTradesPerDay: 5,
  maxLosingStreakWarning: 3,
  minimumRiskRewardRatio: 2,
  enableRiskWarning: true,
};

export const DEFAULT_JOURNAL_STATE: JournalState = {
  settings: DEFAULT_SETTINGS,
  trades: [],
  withdrawals: [],
  strategies: [],
  filterPresets: [],
  aiAnalyses: [],
};
