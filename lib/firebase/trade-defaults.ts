import type {
  ChecklistStatus,
  RuleFollowed,
  Trade,
  TradeQualityGrade,
  TradeStatus,
  TradeTimeframe,
} from "@/types";

type TradeRecord = Record<string, unknown>;

const timeframes: TradeTimeframe[] = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"];
const statuses: TradeStatus[] = ["Win", "Loss", "Breakeven", "Running", "Cancelled"];
const checklistStatuses: ChecklistStatus[] = ["Plan Passed", "Plan Warning"];
const ruleStatuses: RuleFollowed[] = ["Yes", "No", "Partially"];
const qualityGrades: TradeQualityGrade[] = ["A+", "A", "B", "C", "D"];

export function normalizeTradeDocument(id: string, data: TradeRecord): Trade {
  const timestamp = readNumber(data.timestamp, readNumber(data.createdAt, Date.now()));
  const grossProfitLoss = readNumber(data.grossProfitLoss, readNumber(data.pnl, 0));
  const commission = readNumber(data.commission, readNumber(data.fees, 0));
  const swap = readNumber(data.swap, 0);
  const netProfitLoss = readNumber(data.netProfitLoss, grossProfitLoss - commission + swap);
  const startingBalance = readNumber(data.startingBalance, 0);
  const withdrawalAmount = readNumber(data.withdrawalAmount, 0);
  const endingBalance = readNumber(
    data.endingBalance,
    startingBalance + netProfitLoss - withdrawalAmount,
  );

  return {
    id,
    tradeNumber: readNumber(data.tradeNumber, 0),
    date: readString(data.date, deriveLocalDate(timestamp)),
    time: readString(data.time, deriveLocalTime(timestamp)),
    timestamp,
    symbol: readString(data.symbol, ""),
    direction: readEnum(data.direction, ["Buy", "Sell"], "Buy"),
    timeframe: readEnum(data.timeframe, timeframes, "M15"),
    entryPrice: readNumber(data.entryPrice, 0),
    stopLoss: readNumber(data.stopLoss, 0),
    takeProfit: readNumber(data.takeProfit, 0),
    lotSize: readNumber(data.lotSize, readNumber(data.positionSize, 0)),
    riskAmount: readNumber(data.riskAmount, 0),
    rewardAmount: readNumber(data.rewardAmount, 0),
    grossProfitLoss,
    commission,
    swap,
    netProfitLoss,
    withdrawalAmount,
    startingBalance,
    endingBalance,
    growthPercent: readNumber(
      data.growthPercent,
      calculateGrowthPercent(startingBalance, endingBalance),
    ),
    riskRewardRatio: readNumber(
      data.riskRewardRatio,
      calculateRiskReward(data.riskAmount, data.rewardAmount),
    ),
    rMultiple: readNumber(data.rMultiple, 0),
    status: readEnum(data.status, statuses, mapLegacyStatus(data)),
    strategyName: readString(data.strategyName, ""),
    strategyId: readOptionalString(data.strategyId),
    setupType: readString(data.setupType, ""),
    emotionBefore: readString(data.emotionBefore, ""),
    emotionAfter: readString(data.emotionAfter, ""),
    mistakeMade: readString(data.mistakeMade, ""),
    lessonLearned: readString(data.lessonLearned, ""),
    notes: readString(data.notes, ""),
    beforeScreenshotUrl: readOptionalString(data.beforeScreenshotUrl),
    afterScreenshotUrl: readOptionalString(data.afterScreenshotUrl),
    checklistTrendConfirmed: readBoolean(data.checklistTrendConfirmed, false),
    checklistKeyLevelConfirmed: readBoolean(data.checklistKeyLevelConfirmed, false),
    checklistEntryReasonConfirmed: readBoolean(data.checklistEntryReasonConfirmed, false),
    checklistStopLossPlanned: readBoolean(data.checklistStopLossPlanned, false),
    checklistTakeProfitPlanned: readBoolean(data.checklistTakeProfitPlanned, false),
    checklistRiskAccepted: readBoolean(data.checklistRiskAccepted, false),
    checklistNoRevengeTrade: readBoolean(data.checklistNoRevengeTrade, false),
    checklistNoOverlot: readBoolean(data.checklistNoOverlot, false),
    checklistNewsChecked: readBoolean(data.checklistNewsChecked, false),
    checklistEmotionStable: readBoolean(data.checklistEmotionStable, false),
    checklistScore: readNumber(data.checklistScore, 0),
    checklistStatus: readEnum(data.checklistStatus, checklistStatuses, "Plan Warning"),
    mistakeTags: readStringArray(data.mistakeTags, readStringArray(data.mistakes, [])),
    ruleFollowed: readEnum(data.ruleFollowed, ruleStatuses, "Partially"),
    ruleBrokenNotes: readString(data.ruleBrokenNotes, ""),
    tradeQualityScore: readNumber(data.tradeQualityScore, 0),
    tradeQualityGrade: readEnum(data.tradeQualityGrade, qualityGrades, "D"),
    reviewCompleted: readBoolean(data.reviewCompleted, false),
    reviewDate: readString(data.reviewDate, ""),
    reviewNotes: readString(data.reviewNotes, ""),
    createdAt: readNumber(data.createdAt, timestamp),
    updatedAt: readNumber(data.updatedAt, timestamp),
  };
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : fallback;
}

function readEnum<T extends string>(value: unknown, allowedValues: readonly T[], fallback: T) {
  return typeof value === "string" && allowedValues.includes(value as T) ? (value as T) : fallback;
}

function deriveLocalDate(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function deriveLocalTime(timestamp: number) {
  return new Date(timestamp).toTimeString().slice(0, 5);
}

function calculateGrowthPercent(startingBalance: number, endingBalance: number) {
  return startingBalance > 0
    ? Number((((endingBalance - startingBalance) / startingBalance) * 100).toFixed(2))
    : 0;
}

function calculateRiskReward(riskAmount: unknown, rewardAmount: unknown) {
  const risk = readNumber(riskAmount, 0);
  const reward = readNumber(rewardAmount, 0);
  return risk > 0 ? Number((reward / risk).toFixed(2)) : 0;
}

function mapLegacyStatus(data: TradeRecord): TradeStatus {
  if (data.status === "open" || data.status === "planned") {
    return "Running";
  }

  if (data.status === "closed" && data.outcome === "win") {
    return "Win";
  }

  if (data.status === "closed" && data.outcome === "loss") {
    return "Loss";
  }

  if (data.status === "closed" && data.outcome === "breakeven") {
    return "Breakeven";
  }

  return "Running";
}
