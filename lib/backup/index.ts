import { z } from "zod";
import {
  calculateChecklistScore,
  calculateChecklistStatus,
  calculateRiskRewardRatio,
  calculateTradeQualityGrade,
  calculateTradeQualityScore,
} from "@/lib/calculations";
import { recalculateTradesInSequence } from "@/lib/trades/trade-ledger";
import { DEFAULT_SETTINGS } from "@/store";
import type { AiAnalysis, AppSettings, FilterPreset, Strategy, Trade } from "@/types";

export type FullBackup = {
  settings: AppSettings;
  trades: Trade[];
  aiAnalyses: AiAnalysis[];
  strategies: Strategy[];
  filterPresets: FilterPreset[];
  exportedAt: string;
  appVersion: string;
};

const backupSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
  trades: z.array(z.record(z.string(), z.unknown())),
  aiAnalyses: z.array(z.record(z.string(), z.unknown())).default([]),
  strategies: z.array(z.record(z.string(), z.unknown())),
  filterPresets: z.array(z.record(z.string(), z.unknown())),
  exportedAt: z.string(),
  appVersion: z.string(),
});

export function createFullBackup(data: Omit<FullBackup, "appVersion" | "exportedAt">): FullBackup {
  return {
    ...data,
    appVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
  };
}

export function parseBackup(rawValue: string) {
  const parsed = backupSchema.safeParse(JSON.parse(rawValue));

  if (!parsed.success) {
    throw new Error("Backup file structure is invalid.");
  }

  const settings = { ...DEFAULT_SETTINGS, ...parsed.data.settings } as AppSettings;
  const trades = recalculateTradesInSequence(
    parsed.data.trades.map(normalizeTrade),
    settings.initialBalance,
  );

  return {
    settings,
    trades,
    aiAnalyses: parsed.data.aiAnalyses as AiAnalysis[],
    strategies: parsed.data.strategies as Strategy[],
    filterPresets: parsed.data.filterPresets as FilterPreset[],
    exportedAt: parsed.data.exportedAt,
    appVersion: parsed.data.appVersion,
  } satisfies FullBackup;
}

function normalizeTrade(rawTrade: Record<string, unknown>) {
  const checklistScore = calculateChecklistScore(rawTrade);
  const checklistStatus = calculateChecklistStatus(checklistScore);
  const direction = rawTrade.direction === "Sell" ? "Sell" : "Buy";
  const riskRewardRatio = calculateRiskRewardRatio(
    direction,
    rawTrade.entryPrice,
    rawTrade.stopLoss,
    rawTrade.takeProfit,
  );
  const rMultiple = number(rawTrade.rMultiple);
  const timestamp =
    number(rawTrade.timestamp) ||
    new Date(`${text(rawTrade.date)}T${text(rawTrade.time) || "00:00"}`).getTime() ||
    Date.now();
  const trade = {
    id: text(rawTrade.id) || crypto.randomUUID(),
    tradeNumber: number(rawTrade.tradeNumber),
    date: text(rawTrade.date),
    time: text(rawTrade.time),
    timestamp,
    symbol: text(rawTrade.symbol).toUpperCase(),
    direction,
    timeframe: text(rawTrade.timeframe) || "M15",
    entryPrice: number(rawTrade.entryPrice),
    stopLoss: number(rawTrade.stopLoss),
    takeProfit: number(rawTrade.takeProfit),
    lotSize: number(rawTrade.lotSize),
    riskAmount: number(rawTrade.riskAmount),
    rewardAmount: number(rawTrade.rewardAmount),
    grossProfitLoss: number(rawTrade.grossProfitLoss),
    commission: number(rawTrade.commission),
    swap: number(rawTrade.swap),
    netProfitLoss: number(rawTrade.netProfitLoss),
    withdrawalAmount: number(rawTrade.withdrawalAmount),
    startingBalance: number(rawTrade.startingBalance),
    endingBalance: number(rawTrade.endingBalance),
    growthPercent: number(rawTrade.growthPercent),
    riskRewardRatio,
    rMultiple,
    status: text(rawTrade.status) || "Running",
    strategyName: text(rawTrade.strategyName),
    strategyId: text(rawTrade.strategyId) || undefined,
    setupType: text(rawTrade.setupType),
    emotionBefore: text(rawTrade.emotionBefore),
    emotionAfter: text(rawTrade.emotionAfter),
    mistakeMade: text(rawTrade.mistakeMade),
    lessonLearned: text(rawTrade.lessonLearned),
    notes: text(rawTrade.notes),
    beforeScreenshotUrl: text(rawTrade.beforeScreenshotUrl) || undefined,
    afterScreenshotUrl: text(rawTrade.afterScreenshotUrl) || undefined,
    checklistTrendConfirmed: boolean(rawTrade.checklistTrendConfirmed),
    checklistKeyLevelConfirmed: boolean(rawTrade.checklistKeyLevelConfirmed),
    checklistEntryReasonConfirmed: boolean(rawTrade.checklistEntryReasonConfirmed),
    checklistStopLossPlanned: boolean(rawTrade.checklistStopLossPlanned),
    checklistTakeProfitPlanned: boolean(rawTrade.checklistTakeProfitPlanned),
    checklistRiskAccepted: boolean(rawTrade.checklistRiskAccepted),
    checklistNoRevengeTrade: boolean(rawTrade.checklistNoRevengeTrade),
    checklistNoOverlot: boolean(rawTrade.checklistNoOverlot),
    checklistNewsChecked: boolean(rawTrade.checklistNewsChecked),
    checklistEmotionStable: boolean(rawTrade.checklistEmotionStable),
    checklistScore,
    checklistStatus,
    mistakeTags: Array.isArray(rawTrade.mistakeTags) ? rawTrade.mistakeTags.map(String) : [],
    ruleFollowed:
      rawTrade.ruleFollowed === "No" || rawTrade.ruleFollowed === "Partially"
        ? rawTrade.ruleFollowed
        : "Yes",
    ruleBrokenNotes: text(rawTrade.ruleBrokenNotes),
    tradeQualityScore: 0,
    tradeQualityGrade: "D",
    reviewCompleted: boolean(rawTrade.reviewCompleted),
    reviewDate: text(rawTrade.reviewDate),
    reviewNotes: text(rawTrade.reviewNotes),
    createdAt: number(rawTrade.createdAt) || Date.now(),
    updatedAt: Date.now(),
  } as Trade;
  const tradeQualityScore = calculateTradeQualityScore(trade);

  return {
    ...trade,
    tradeQualityScore,
    tradeQualityGrade: calculateTradeQualityGrade(tradeQualityScore),
  };
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function boolean(value: unknown) {
  return value === true;
}
