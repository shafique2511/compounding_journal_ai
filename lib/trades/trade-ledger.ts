import type { AppSettings, Trade, TradeDirection, TradeStatus } from "@/types";
import {
  calculateChecklistScore,
  calculateChecklistStatus,
  calculateEndingBalance,
  calculateGrowthPercent,
  calculateNetProfitLoss,
  calculateRMultiple,
  calculateRiskRewardRatio,
  calculateTradeQualityGrade,
  calculateTradeQualityScore,
} from "@/lib/calculations";

export type TradeFormValues = {
  date: string;
  time: string;
  symbol: string;
  direction: TradeDirection;
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  startingBalance: number;
  riskAmount: number;
  rewardAmount: number;
  grossProfitLoss: number;
  commission: number;
  swap: number;
  netProfitLoss: number;
  withdrawalAmount: number;
  endingBalance: number;
  growthPercent: number;
  riskRewardRatio: number;
  rMultiple: number;
  status: TradeStatus;
  strategyName: string;
  strategyId?: string;
  setupType: string;
  emotionBefore: string;
  emotionAfter: string;
  mistakeMade: string;
  lessonLearned: string;
  notes: string;
  beforeScreenshotUrl?: string;
  afterScreenshotUrl?: string;
  checklistTrendConfirmed: boolean;
  checklistKeyLevelConfirmed: boolean;
  checklistEntryReasonConfirmed: boolean;
  checklistStopLossPlanned: boolean;
  checklistTakeProfitPlanned: boolean;
  checklistRiskAccepted: boolean;
  checklistNoRevengeTrade: boolean;
  checklistNoOverlot: boolean;
  checklistNewsChecked: boolean;
  checklistEmotionStable: boolean;
  mistakeTags: string[];
  ruleFollowed: "Yes" | "No" | "Partially";
  ruleBrokenNotes: string;
  reviewCompleted: boolean;
  reviewDate: string;
  reviewNotes: string;
};

export type TradeFilters = {
  search: string;
  dateFrom: string;
  dateTo: string;
  symbol: string;
  timeframe: string;
  status: string;
  strategy: string;
  qualityGrade: string;
  ruleFollowed: string;
};

export type TradeSort =
  | "newest"
  | "oldest"
  | "highest-profit"
  | "biggest-loss";

export const EMPTY_TRADE_FILTERS: TradeFilters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  symbol: "",
  timeframe: "",
  status: "",
  strategy: "",
  qualityGrade: "",
  ruleFollowed: "",
};

export function createTradeFromForm(values: TradeFormValues, existingTrade?: Trade): Trade {
  const now = Date.now();
  const rewardAmount =
    toNumber(values.rewardAmount) ||
    Math.abs(toNumber(values.takeProfit) - toNumber(values.entryPrice)) * toNumber(values.lotSize);
  const riskRewardRatio = calculateRiskRewardRatio(
    values.direction,
    values.entryPrice,
    values.stopLoss,
    values.takeProfit,
  );
  const netProfitLoss = calculateNetProfitLoss(
    values.grossProfitLoss,
    values.commission,
    values.swap,
  );
  const rMultiple = calculateRMultiple(netProfitLoss, values.riskAmount);
  const checklistScore = calculateChecklistScore(values);
  const checklistStatus = calculateChecklistStatus(checklistScore);
  const timestamp = new Date(`${values.date}T${values.time || "00:00"}`).getTime();
  const safeTimestamp = Number.isFinite(timestamp) ? timestamp : now;

  const baseTrade: Trade = {
    id: existingTrade?.id ?? crypto.randomUUID(),
    tradeNumber: existingTrade?.tradeNumber ?? 0,
    date: values.date,
    time: values.time,
    timestamp: safeTimestamp,
    symbol: values.symbol.trim().toUpperCase(),
    direction: values.direction,
    timeframe: values.timeframe as Trade["timeframe"],
    entryPrice: toNumber(values.entryPrice),
    stopLoss: toNumber(values.stopLoss),
    takeProfit: toNumber(values.takeProfit),
    lotSize: toNumber(values.lotSize),
    riskAmount: toNumber(values.riskAmount),
    rewardAmount,
    grossProfitLoss: toNumber(values.grossProfitLoss),
    commission: toNumber(values.commission),
    swap: toNumber(values.swap),
    netProfitLoss,
    withdrawalAmount: toNumber(values.withdrawalAmount),
    startingBalance: toNumber(values.startingBalance),
    endingBalance: toNumber(values.endingBalance),
    growthPercent: toNumber(values.growthPercent),
    riskRewardRatio,
    rMultiple,
    status: values.status,
    strategyName: values.strategyName.trim(),
    strategyId: values.strategyId?.trim() || undefined,
    setupType: values.setupType.trim(),
    emotionBefore: values.emotionBefore.trim(),
    emotionAfter: values.emotionAfter.trim(),
    mistakeMade: values.mistakeMade.trim(),
    lessonLearned: values.lessonLearned.trim(),
    notes: values.notes.trim(),
    beforeScreenshotUrl: values.beforeScreenshotUrl?.trim() || undefined,
    afterScreenshotUrl: values.afterScreenshotUrl?.trim() || undefined,
    checklistTrendConfirmed: values.checklistTrendConfirmed,
    checklistKeyLevelConfirmed: values.checklistKeyLevelConfirmed,
    checklistEntryReasonConfirmed: values.checklistEntryReasonConfirmed,
    checklistStopLossPlanned: values.checklistStopLossPlanned,
    checklistTakeProfitPlanned: values.checklistTakeProfitPlanned,
    checklistRiskAccepted: values.checklistRiskAccepted,
    checklistNoRevengeTrade: values.checklistNoRevengeTrade,
    checklistNoOverlot: values.checklistNoOverlot,
    checklistNewsChecked: values.checklistNewsChecked,
    checklistEmotionStable: values.checklistEmotionStable,
    checklistScore,
    checklistStatus,
    mistakeTags: values.mistakeTags,
    ruleFollowed: values.ruleFollowed,
    ruleBrokenNotes: values.ruleBrokenNotes.trim(),
    tradeQualityScore: 0,
    tradeQualityGrade: "D",
    reviewCompleted: values.reviewCompleted,
    reviewDate: values.reviewDate,
    reviewNotes: values.reviewNotes.trim(),
    createdAt: existingTrade?.createdAt ?? now,
    updatedAt: now,
  };

  const tradeQualityScore = calculateTradeQualityScore(baseTrade);

  return {
    ...baseTrade,
    tradeQualityScore,
    tradeQualityGrade: calculateTradeQualityGrade(tradeQualityScore),
  };
}

export function recalculateTradesInSequence(trades: Trade[], initialBalance: number) {
  let runningBalance = toNumber(initialBalance);

  return sortTradesByTimestamp(trades).map((trade, index) => {
    const netProfitLoss = calculateNetProfitLoss(
      trade.grossProfitLoss,
      trade.commission,
      trade.swap,
    );
    const startingBalance = runningBalance;
    const endingBalance = calculateEndingBalance(
      startingBalance,
      netProfitLoss,
      trade.withdrawalAmount,
    );
    const growthPercent = calculateGrowthPercent(netProfitLoss, startingBalance);
    const riskRewardRatio = calculateRiskRewardRatio(
      trade.direction,
      trade.entryPrice,
      trade.stopLoss,
      trade.takeProfit,
    );
    const rMultiple = calculateRMultiple(netProfitLoss, trade.riskAmount);
    const checklistScore = calculateChecklistScore(trade);
    const checklistStatus = calculateChecklistStatus(checklistScore);
    const tradeQualityScore = calculateTradeQualityScore({
      ...trade,
      checklistScore,
      checklistStatus,
      netProfitLoss,
      startingBalance,
      endingBalance,
      growthPercent,
      riskRewardRatio,
      rMultiple,
    });
    runningBalance = endingBalance;

    return {
      ...trade,
      tradeNumber: index + 1,
      netProfitLoss,
      startingBalance,
      endingBalance,
      growthPercent,
      riskRewardRatio,
      rMultiple,
      checklistScore,
      checklistStatus,
      tradeQualityScore,
      tradeQualityGrade: calculateTradeQualityGrade(tradeQualityScore),
      updatedAt: Date.now(),
    };
  });
}

export function filterTrades(trades: Trade[], filters: TradeFilters) {
  const search = filters.search.trim().toLowerCase();

  return trades.filter((trade) => {
    const matchesSearch =
      !search ||
      trade.symbol.toLowerCase().includes(search) ||
      trade.strategyName.toLowerCase().includes(search) ||
      trade.mistakeTags.join(" ").toLowerCase().includes(search);

    return (
      matchesSearch &&
      (!filters.dateFrom || trade.date >= filters.dateFrom) &&
      (!filters.dateTo || trade.date <= filters.dateTo) &&
      (!filters.symbol || trade.symbol === filters.symbol) &&
      (!filters.timeframe || trade.timeframe === filters.timeframe) &&
      (!filters.status || trade.status === filters.status) &&
      (!filters.strategy || trade.strategyName === filters.strategy) &&
      (!filters.qualityGrade || trade.tradeQualityGrade === filters.qualityGrade) &&
      (!filters.ruleFollowed || trade.ruleFollowed === filters.ruleFollowed)
    );
  });
}

export function sortTrades(trades: Trade[], sort: TradeSort) {
  return [...trades].sort((first, second) => {
    if (sort === "oldest") {
      return first.timestamp - second.timestamp;
    }

    if (sort === "highest-profit") {
      return second.netProfitLoss - first.netProfitLoss;
    }

    if (sort === "biggest-loss") {
      return first.netProfitLoss - second.netProfitLoss;
    }

    return second.timestamp - first.timestamp;
  });
}

export function getTradeFormDefaults(settings: AppSettings, trade?: Trade): TradeFormValues {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);

  return {
    date: trade?.date ?? date,
    time: trade?.time ?? time,
    symbol: trade?.symbol ?? settings.defaultSymbol,
    direction: trade?.direction ?? "Buy",
    timeframe: trade?.timeframe ?? settings.defaultTimeframe,
    entryPrice: trade?.entryPrice ?? 0,
    stopLoss: trade?.stopLoss ?? 0,
    takeProfit: trade?.takeProfit ?? 0,
    lotSize: trade?.lotSize ?? 0.01,
    startingBalance: trade?.startingBalance ?? settings.initialBalance,
    riskAmount: trade?.riskAmount ?? 0,
    rewardAmount: trade?.rewardAmount ?? 0,
    grossProfitLoss: trade?.grossProfitLoss ?? 0,
    commission: trade?.commission ?? settings.defaultCommission,
    swap: trade?.swap ?? settings.defaultSwap,
    netProfitLoss: trade?.netProfitLoss ?? 0,
    withdrawalAmount: trade?.withdrawalAmount ?? 0,
    endingBalance: trade?.endingBalance ?? settings.initialBalance,
    growthPercent: trade?.growthPercent ?? 0,
    riskRewardRatio: trade?.riskRewardRatio ?? 0,
    rMultiple: trade?.rMultiple ?? 0,
    status: trade?.status ?? "Running",
    strategyName: trade?.strategyName ?? "",
    strategyId: trade?.strategyId ?? "",
    setupType: trade?.setupType ?? "",
    emotionBefore: trade?.emotionBefore ?? "",
    emotionAfter: trade?.emotionAfter ?? "",
    mistakeMade: trade?.mistakeMade ?? "",
    lessonLearned: trade?.lessonLearned ?? "",
    notes: trade?.notes ?? "",
    beforeScreenshotUrl: trade?.beforeScreenshotUrl ?? "",
    afterScreenshotUrl: trade?.afterScreenshotUrl ?? "",
    checklistTrendConfirmed: trade?.checklistTrendConfirmed ?? false,
    checklistKeyLevelConfirmed: trade?.checklistKeyLevelConfirmed ?? false,
    checklistEntryReasonConfirmed: trade?.checklistEntryReasonConfirmed ?? false,
    checklistStopLossPlanned: trade?.checklistStopLossPlanned ?? false,
    checklistTakeProfitPlanned: trade?.checklistTakeProfitPlanned ?? false,
    checklistRiskAccepted: trade?.checklistRiskAccepted ?? false,
    checklistNoRevengeTrade: trade?.checklistNoRevengeTrade ?? false,
    checklistNoOverlot: trade?.checklistNoOverlot ?? false,
    checklistNewsChecked: trade?.checklistNewsChecked ?? false,
    checklistEmotionStable: trade?.checklistEmotionStable ?? false,
    mistakeTags: trade?.mistakeTags ?? [],
    ruleFollowed: trade?.ruleFollowed ?? "Yes",
    ruleBrokenNotes: trade?.ruleBrokenNotes ?? "",
    reviewCompleted: trade?.reviewCompleted ?? false,
    reviewDate: trade?.reviewDate ?? "",
    reviewNotes: trade?.reviewNotes ?? "",
  };
}

function sortTradesByTimestamp(trades: Trade[]) {
  return [...trades].sort((first, second) => first.timestamp - second.timestamp);
}

function toNumber(value: unknown) {
  const parsedValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}
