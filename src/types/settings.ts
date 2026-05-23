import type { AiProvider } from "@/src/types/ai";

export const dateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;
export const timeFormats = ["12-hour", "24-hour"] as const;
export const themeModes = ["light", "dark", "system"] as const;

export type DateFormat = (typeof dateFormats)[number];
export type TimeFormat = (typeof timeFormats)[number];
export type ThemeMode = (typeof themeModes)[number];

export type AppSettings = {
  initialBalance: number;
  currency: string;
  timezoneOffset: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  autoTradeNumber: boolean;
  defaultTimeframe: string;
  defaultSymbol: string;
  defaultCommission: number;
  defaultSwap: number;
  themeMode: ThemeMode;
  accentColor: string;
  aiProvider: AiProvider;
  aiModel: string;
  enableScreenshotAnalysis: boolean;
  saveAiAnalysisHistory: boolean;
  maxRiskPerTradePercent: number;
  maxDailyLossPercent: number;
  maxWeeklyLossPercent: number;
  maxTradesPerDay: number;
  maxLosingStreakWarning: number;
  minimumRiskRewardRatio: number;
  enableRiskWarning: boolean;
};
