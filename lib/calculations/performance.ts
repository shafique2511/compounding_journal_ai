import type { AppSettings, Trade, TradeQualityGrade } from "@/types";

type Checklist = Record<string, unknown>;

const checklistKeys = [
  "checklistTrendConfirmed",
  "checklistKeyLevelConfirmed",
  "checklistEntryReasonConfirmed",
  "checklistStopLossPlanned",
  "checklistTakeProfitPlanned",
  "checklistRiskAccepted",
  "checklistNoRevengeTrade",
  "checklistNoOverlot",
  "checklistNewsChecked",
  "checklistEmotionStable",
] as const;

export function calculateRiskRewardRatio(
  direction: unknown,
  entryPrice: unknown,
  stopLoss: unknown,
  takeProfit: unknown,
) {
  const entry = toNumber(entryPrice);
  const stop = toNumber(stopLoss);
  const target = toNumber(takeProfit);
  const tradeDirection = direction === "Sell" ? "Sell" : "Buy";
  const risk = tradeDirection === "Buy" ? entry - stop : stop - entry;
  const reward = tradeDirection === "Buy" ? target - entry : entry - target;

  if (risk <= 0) {
    return 0;
  }

  return roundRatio(reward / risk);
}

export function calculateRMultiple(netProfitLoss: unknown, riskAmount: unknown) {
  const risk = toNumber(riskAmount);

  if (risk === 0) {
    return 0;
  }

  return roundRatio(toNumber(netProfitLoss) / risk);
}

export function calculateChecklistScore(checklist: Checklist = {}) {
  const checkedItems = checklistKeys.filter((key) => checklist[key] === true).length;

  return roundPercent((checkedItems / checklistKeys.length) * 100);
}

export function calculateChecklistStatus(score: unknown) {
  return toNumber(score) >= 80 ? "Plan Passed" : "Plan Warning";
}

export function calculateTradeQualityScore(trade: Partial<Trade> = {}) {
  let score = 100;
  const checklistScore = toNumber(trade.checklistScore, calculateChecklistScore(trade));

  if (checklistScore < 80) {
    score -= 20;
  }

  if (trade.ruleFollowed === "No") {
    score -= 15;
  }

  if (trade.ruleFollowed === "Partially") {
    score -= 10;
  }

  if (toNumber(trade.riskRewardRatio) < 1.5) {
    score -= 15;
  }

  if (toNumber(trade.rMultiple) < 0) {
    score -= 15;
  }

  if ((trade.mistakeTags ?? []).length > 0) {
    score -= 10;
  }

  if (!String(trade.notes ?? "").trim()) {
    score -= 10;
  }

  if (!trade.beforeScreenshotUrl) {
    score -= 10;
  }

  return clamp(score, 0, 100);
}

export function calculateTradeQualityGrade(score: unknown): TradeQualityGrade {
  const numericScore = toNumber(score);

  if (numericScore >= 90) {
    return "A+";
  }

  if (numericScore >= 80) {
    return "A";
  }

  if (numericScore >= 70) {
    return "B";
  }

  if (numericScore >= 60) {
    return "C";
  }

  return "D";
}

export function calculateWinRate(trades: Partial<Trade>[] = []) {
  const closedTrades = trades.filter((trade) =>
    ["Win", "Loss", "Breakeven"].includes(String(trade.status)),
  );

  if (closedTrades.length === 0) {
    return 0;
  }

  const wins = closedTrades.filter((trade) => trade.status === "Win").length;
  return roundPercent((wins / closedTrades.length) * 100);
}

export function calculateLossRate(trades: Partial<Trade>[] = []) {
  const closedTrades = trades.filter((trade) =>
    ["Win", "Loss", "Breakeven"].includes(String(trade.status)),
  );

  if (closedTrades.length === 0) {
    return 0;
  }

  const losses = closedTrades.filter((trade) => trade.status === "Loss").length;
  return roundPercent((losses / closedTrades.length) * 100);
}

export function calculateAverageR(trades: Partial<Trade>[] = []) {
  if (trades.length === 0) {
    return 0;
  }

  const totalR = trades.reduce((total, trade) => total + toNumber(trade.rMultiple), 0);
  return roundRatio(totalR / trades.length);
}

export function calculateProfitFactor(trades: Partial<Trade>[] = []) {
  const grossProfit = trades
    .filter((trade) => toNumber(trade.netProfitLoss) > 0)
    .reduce((total, trade) => total + toNumber(trade.netProfitLoss), 0);
  const grossLoss = Math.abs(
    trades
      .filter((trade) => toNumber(trade.netProfitLoss) < 0)
      .reduce((total, trade) => total + toNumber(trade.netProfitLoss), 0),
  );

  if (grossLoss === 0) {
    return grossProfit > 0 ? roundRatio(grossProfit) : 0;
  }

  return roundRatio(grossProfit / grossLoss);
}

export function calculateStreaks(trades: Partial<Trade>[] = []) {
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;

  sortTrades(trades).forEach((trade) => {
    if (trade.status === "Win") {
      currentWinStreak += 1;
      currentLossStreak = 0;
    } else if (trade.status === "Loss") {
      currentLossStreak += 1;
      currentWinStreak = 0;
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }

    maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
  });

  return {
    currentWinStreak,
    currentLossStreak,
    maxWinStreak,
    maxLossStreak,
  };
}

export function calculateRuleDisciplineScore(trades: Partial<Trade>[] = []) {
  if (trades.length === 0) {
    return 0;
  }

  const score = trades.reduce((total, trade) => {
    if (trade.ruleFollowed === "Yes") {
      return total + 1;
    }

    if (trade.ruleFollowed === "Partially") {
      return total + 0.5;
    }

    return total;
  }, 0);

  return roundPercent((score / trades.length) * 100);
}

export function calculateMistakeTagStats(trades: Partial<Trade>[] = []) {
  return trades.reduce<Record<string, number>>((stats, trade) => {
    (trade.mistakeTags ?? []).forEach((tag) => {
      stats[tag] = (stats[tag] ?? 0) + 1;
    });
    return stats;
  }, {});
}

export function calculateQualityGradeStats(trades: Partial<Trade>[] = []) {
  const stats: Record<TradeQualityGrade, number> = { "A+": 0, A: 0, B: 0, C: 0, D: 0 };

  trades.forEach((trade) => {
    const grade = trade.tradeQualityGrade ?? calculateTradeQualityGrade(trade.tradeQualityScore);
    stats[grade] += 1;
  });

  return stats;
}

export function calculateStrategyStats(trades: Partial<Trade>[] = []) {
  const stats: Record<
    string,
    { trades: number; wins: number; losses: number; netProfitLoss: number; winRate: number }
  > = {};

  trades.forEach((trade) => {
    const strategyName = trade.strategyName || "Unassigned";
    const current = stats[strategyName] ?? {
      trades: 0,
      wins: 0,
      losses: 0,
      netProfitLoss: 0,
      winRate: 0,
    };

    current.trades += 1;
    current.wins += trade.status === "Win" ? 1 : 0;
    current.losses += trade.status === "Loss" ? 1 : 0;
    current.netProfitLoss = roundMoney(current.netProfitLoss + toNumber(trade.netProfitLoss));
    current.winRate = current.trades > 0 ? roundPercent((current.wins / current.trades) * 100) : 0;
    stats[strategyName] = current;
  });

  return stats;
}

export function calculateRiskRuleWarnings(
  trade: Partial<Trade> = {},
  settings: Partial<AppSettings> = {},
) {
  const warnings: string[] = [];
  const startingBalance = toNumber(trade.startingBalance);
  const riskAmount = toNumber(trade.riskAmount);
  const riskPercent = startingBalance > 0 ? (riskAmount / startingBalance) * 100 : 0;

  if (
    toNumber(settings.maxRiskPerTradePercent) > 0 &&
    riskPercent > toNumber(settings.maxRiskPerTradePercent)
  ) {
    warnings.push("Risk per trade exceeds configured maximum.");
  }

  if (
    toNumber(settings.minimumRiskRewardRatio) > 0 &&
    toNumber(trade.riskRewardRatio) < toNumber(settings.minimumRiskRewardRatio)
  ) {
    warnings.push("Risk reward ratio is below configured minimum.");
  }

  return warnings;
}

function sortTrades(trades: Partial<Trade>[]) {
  return [...trades].sort((first, second) => toNumber(first.timestamp) - toNumber(second.timestamp));
}

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRatio(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
