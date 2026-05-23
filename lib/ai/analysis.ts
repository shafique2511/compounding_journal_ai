import {
  calculateAverageR,
  calculateCumulativeProfit,
  calculateDrawdownSeries,
  calculateEquityCurve,
  calculateLossRate,
  calculateMaxDrawdown,
  calculateMistakeTagStats,
  calculateProfitFactor,
  calculateQualityGradeStats,
  calculateRuleDisciplineScore,
  calculateStrategyStats,
  calculateWinRate,
} from "@/lib/calculations";
import type { AppSettings, Strategy, Trade } from "@/types";

export type AiAnalysisFilter =
  | "all"
  | "week"
  | "month"
  | "custom"
  | "trade"
  | "strategy"
  | "symbol"
  | "losing"
  | "rule-broken"
  | "low-quality";

export type AiFilterValues = {
  filter: AiAnalysisFilter;
  customFrom: string;
  customTo: string;
  selectedStrategy: string;
  selectedSymbol: string;
  selectedTradeId: string;
};

export type AiInputSummary = ReturnType<typeof buildAiInputSummary>;

export function filterTradesForAi(trades: Trade[], values: AiFilterValues) {
  const sortedTrades = [...trades].sort((first, second) => first.timestamp - second.timestamp);

  if (values.filter === "trade") {
    return sortedTrades.filter((trade) => trade.id === values.selectedTradeId);
  }

  if (values.filter === "strategy") {
    return sortedTrades.filter((trade) => trade.strategyName === values.selectedStrategy);
  }

  if (values.filter === "symbol") {
    return sortedTrades.filter((trade) => trade.symbol === values.selectedSymbol);
  }

  if (values.filter === "losing") {
    return sortedTrades.filter((trade) => trade.status === "Loss" || trade.netProfitLoss < 0);
  }

  if (values.filter === "rule-broken") {
    return sortedTrades.filter((trade) => trade.ruleFollowed === "No");
  }

  if (values.filter === "low-quality") {
    return sortedTrades.filter(
      (trade) => trade.tradeQualityScore < 70 || ["C", "D"].includes(trade.tradeQualityGrade),
    );
  }

  const range = getDateRange(values);

  return sortedTrades.filter(
    (trade) =>
      (!range.from || trade.date >= range.from) &&
      (!range.to || trade.date <= range.to),
  );
}

export function buildAiInputSummary(
  trades: Trade[],
  allStrategies: Strategy[],
  settings: AppSettings,
  values: AiFilterValues,
) {
  const sortedTrades = [...trades].sort((first, second) => first.timestamp - second.timestamp);
  const wins = sortedTrades.filter((trade) => trade.status === "Win");
  const losses = sortedTrades.filter((trade) => trade.status === "Loss");
  const breakeven = sortedTrades.filter((trade) => trade.status === "Breakeven");
  const netProfit = calculateCumulativeProfit(sortedTrades);
  const withdrawals = sum(sortedTrades.map((trade) => trade.withdrawalAmount));
  const bestTrade = maxBy(sortedTrades, "netProfitLoss");
  const worstTrade = minBy(sortedTrades, "netProfitLoss");
  const strategyStats = calculateStrategyStats(sortedTrades);
  const strategyTemplateReview = buildStrategyTemplateReview(sortedTrades, allStrategies);
  const equityCurve = calculateEquityCurve(sortedTrades).map((point) => ({
    tradeNumber: point.tradeNumber,
    equity: point.equity,
  }));
  const drawdownCurve = calculateDrawdownSeries(sortedTrades).map((point) => ({
    tradeNumber: point.tradeNumber,
    drawdownPercent: point.drawdownPercent,
  }));
  const cumulativeProfitCurve = buildCumulativeProfitCurve(sortedTrades);
  const screenshotStats = {
    beforeEntryCount: sortedTrades.filter((trade) => Boolean(trade.beforeScreenshotUrl)).length,
    afterEntryCount: sortedTrades.filter((trade) => Boolean(trade.afterScreenshotUrl)).length,
    missingBeforeEntryCount: sortedTrades.filter((trade) => !trade.beforeScreenshotUrl).length,
    missingAfterEntryCount: sortedTrades.filter((trade) => !trade.afterScreenshotUrl).length,
    screenshotAnalysisEnabled: settings.enableScreenshotAnalysis,
  };

  return {
    aiRules: {
      role: "Trading journal coach only.",
      restrictions: [
        "Do not provide trade signals.",
        "Do not say to take a specific trade.",
        "Do not guarantee profit.",
        "Do not encourage revenge trading.",
        "Do not encourage overlotting.",
        "Do not give unsafe risk advice.",
      ],
    },
    filter: {
      type: values.filter,
      customFrom: values.customFrom,
      customTo: values.customTo,
      selectedTradeId: values.selectedTradeId,
      selectedStrategy: values.selectedStrategy,
      selectedSymbol: values.selectedSymbol,
    },
    settings: {
      initialBalance: settings.initialBalance,
      currency: settings.currency,
      timezoneOffset: settings.timezoneOffset,
      maxRiskPerTradePercent: settings.maxRiskPerTradePercent,
      maxDailyLossPercent: settings.maxDailyLossPercent,
      maxWeeklyLossPercent: settings.maxWeeklyLossPercent,
      minimumRiskRewardRatio: settings.minimumRiskRewardRatio,
      enableRiskWarning: settings.enableRiskWarning,
    },
    performance: {
      totalTrades: sortedTrades.length,
      wins: wins.length,
      losses: losses.length,
      breakeven: breakeven.length,
      winRate: calculateWinRate(sortedTrades),
      lossRate: calculateLossRate(sortedTrades),
      netProfit,
      withdrawals,
      profitFactor: calculateProfitFactor(sortedTrades),
      maxDrawdown: calculateMaxDrawdown(sortedTrades),
      averageRMultiple: calculateAverageR(sortedTrades),
      averageTradeQualityScore: average(sortedTrades.map((trade) => trade.tradeQualityScore)),
      ruleDisciplineScore: calculateRuleDisciplineScore(sortedTrades),
      currentBalance: sortedTrades.at(-1)?.endingBalance ?? settings.initialBalance,
      compoundingGrowthPercent: calculateGrowthPercentFromBalances(
        settings.initialBalance,
        sortedTrades.at(-1)?.endingBalance ?? settings.initialBalance,
      ),
    },
    bestTrade: summarizeTrade(bestTrade),
    worstTrade: summarizeTrade(worstTrade),
    mistakeTags: calculateMistakeTagStats(sortedTrades),
    qualityGrades: calculateQualityGradeStats(sortedTrades),
    strategyPerformance: strategyStats,
    strategyTemplateReview,
    activeStrategies: allStrategies
      .filter((strategy) => strategy.isActive)
      .map((strategy) => ({
        strategyName: strategy.strategyName,
        marketType: strategy.marketType,
        timeframe: strategy.timeframe,
        entryRules: strategy.entryRules,
        exitRules: strategy.exitRules,
        riskRules: strategy.riskRules,
      })),
    timeframePerformance: groupPerformance(sortedTrades, (trade) => trade.timeframe),
    symbolPerformance: groupPerformance(sortedTrades, (trade) => trade.symbol),
    psychology: {
      emotionsBefore: countTextValues(sortedTrades.map((trade) => trade.emotionBefore)),
      emotionsAfter: countTextValues(sortedTrades.map((trade) => trade.emotionAfter)),
      commonMistakes: countTextValues(sortedTrades.map((trade) => trade.mistakeMade)),
      repeatedLessons: countTextValues(sortedTrades.map((trade) => trade.lessonLearned)),
    },
    discipline: {
      checklistPassed: sortedTrades.filter((trade) => trade.checklistStatus === "Plan Passed").length,
      checklistWarning: sortedTrades.filter((trade) => trade.checklistStatus === "Plan Warning").length,
      rulesFollowed: sortedTrades.filter((trade) => trade.ruleFollowed === "Yes").length,
      rulesPartiallyFollowed: sortedTrades.filter((trade) => trade.ruleFollowed === "Partially").length,
      rulesBroken: sortedTrades.filter((trade) => trade.ruleFollowed === "No").length,
    },
    screenshots: screenshotStats,
    review: {
      reviewedTrades: sortedTrades.filter((trade) => trade.reviewCompleted).length,
      unreviewedTrades: sortedTrades.filter((trade) => !trade.reviewCompleted).length,
      unreviewedLosingTrades: sortedTrades.filter(
        (trade) => trade.status === "Loss" && !trade.reviewCompleted,
      ).length,
    },
    curves: {
      equityCurve,
      drawdownCurve,
      cumulativeProfitCurve,
    },
    recentTrades: sortedTrades.slice(-25).map(summarizeTrade).filter(Boolean),
  };
}

export function buildAiPrompt(summary: AiInputSummary) {
  return [
    "Act as a professional trading journal coach reviewing a trade-by-trade compounding journal.",
    "Use only the provided journal data. Do not invent broker data, signals, entries, exits, or market predictions.",
    "Do not recommend taking a specific trade. Do not guarantee profit. Do not encourage revenge trading, overlotting, or unsafe risk.",
    "Analyze the trader's progress, behavior, discipline, psychology, compounding, screenshots, strategies, symbols, timeframes, equity curve, drawdown curve, and cumulative profit curve.",
    "Return the response with these exact section headings:",
    "1. Overall Progress Score",
    "2. Performance Summary",
    "3. Risk Management Review",
    "4. Psychology Review",
    "5. Mistake Pattern Analysis",
    "6. Screenshot Review",
    "7. Compounding Growth Review",
    "8. What Improved",
    "9. What Got Worse",
    "10. Next 5 Focus Areas",
    "11. Action Plan For Next 10 Trades",
    "12. Checklist Discipline Review",
    "13. Mistake Tag Pattern Review",
    "14. Rule Violation Review",
    "15. Trade Quality Score Review",
    "16. Risk Rule Warning Review",
    "17. Strategy Playbook Review",
    "18. Strategy Template Review",
    "19. Review Mode Summary",
    "20. Equity Curve and Drawdown Review",
    "21. Next 10-Trade Improvement Plan",
    "",
    "Journal summary JSON:",
    JSON.stringify(summary),
  ].join("\n");
}

function getDateRange(values: AiFilterValues) {
  const now = new Date();
  const today = formatDate(now);

  if (values.filter === "week") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - start.getDay());
    return { from: formatDate(start), to: today };
  }

  if (values.filter === "month") {
    return { from: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  }

  if (values.filter === "custom") {
    return { from: values.customFrom, to: values.customTo };
  }

  return { from: "", to: "" };
}

function summarizeTrade(trade?: Trade) {
  if (!trade) {
    return null;
  }

  return {
    id: trade.id,
    tradeNumber: trade.tradeNumber,
    date: trade.date,
    time: trade.time,
    symbol: trade.symbol,
    direction: trade.direction,
    timeframe: trade.timeframe,
    status: trade.status,
    strategyName: trade.strategyName,
    netProfitLoss: trade.netProfitLoss,
    withdrawalAmount: trade.withdrawalAmount,
    startingBalance: trade.startingBalance,
    endingBalance: trade.endingBalance,
    growthPercent: trade.growthPercent,
    riskRewardRatio: trade.riskRewardRatio,
    rMultiple: trade.rMultiple,
    checklistScore: trade.checklistScore,
    checklistStatus: trade.checklistStatus,
    ruleFollowed: trade.ruleFollowed,
    tradeQualityScore: trade.tradeQualityScore,
    tradeQualityGrade: trade.tradeQualityGrade,
    mistakeTags: trade.mistakeTags,
    emotionBefore: trade.emotionBefore,
    emotionAfter: trade.emotionAfter,
    mistakeMade: trade.mistakeMade,
    lessonLearned: trade.lessonLearned,
    hasBeforeScreenshot: Boolean(trade.beforeScreenshotUrl),
    hasAfterScreenshot: Boolean(trade.afterScreenshotUrl),
    beforeScreenshotUrl: trade.beforeScreenshotUrl ?? "",
    afterScreenshotUrl: trade.afterScreenshotUrl ?? "",
    reviewCompleted: trade.reviewCompleted,
  };
}

function buildStrategyTemplateReview(trades: Trade[], strategies: Strategy[]) {
  const groups = new Map<string, Trade[]>();

  trades.forEach((trade) => {
    const strategyName = trade.strategyName || "Unassigned";
    groups.set(strategyName, [...(groups.get(strategyName) ?? []), trade]);
  });

  const stats = Array.from(groups, ([strategyName, strategyTrades]) => {
    const mistakes = strategyTrades.flatMap((trade) => trade.mistakeTags);
    const ruleViolations = strategyTrades.filter((trade) => trade.ruleFollowed === "No").length;

    return {
      strategyName,
      totalTrades: strategyTrades.length,
      winRate: calculateWinRate(strategyTrades),
      netProfitLoss: sum(strategyTrades.map((trade) => trade.netProfitLoss)),
      averageR: calculateAverageR(strategyTrades),
      ruleViolations,
      mistakeCount: mistakes.length,
      mostCommonMistakeTags: countTextValues(mistakes).slice(0, 3),
      averageChecklistScore: average(strategyTrades.map((trade) => trade.checklistScore)),
      averageTradeQualityScore: average(strategyTrades.map((trade) => trade.tradeQualityScore)),
    };
  });

  return {
    mostUsedStrategy: maxByValue(stats, (stat) => stat.totalTrades)?.strategyName ?? "-",
    bestPerformingStrategy: maxByValue(stats, (stat) => stat.netProfitLoss)?.strategyName ?? "-",
    weakestStrategy: minByValue(stats, (stat) => stat.netProfitLoss)?.strategyName ?? "-",
    bestAverageRStrategy: maxByValue(stats, (stat) => stat.averageR)?.strategyName ?? "-",
    strategyWithMostRuleViolations: maxByValue(stats, (stat) => stat.ruleViolations)?.strategyName ?? "-",
    strategyWithMostMistakeTags: maxByValue(stats, (stat) => stat.mistakeCount)?.strategyName ?? "-",
    strategyStats: stats,
    strategyRulesForReview: strategies.map((strategy) => ({
      strategyName: strategy.strategyName,
      entryRules: strategy.entryRules,
      exitRules: strategy.exitRules,
      stopLossRules: strategy.stopLossRules,
      takeProfitRules: strategy.takeProfitRules,
      riskRules: strategy.riskRules,
      notes: strategy.notes,
    })),
    coachingInstruction: "Review whether the trader is following saved strategy rules. Suggest focus areas, not live entries or signals.",
  };
}

function groupPerformance(trades: Trade[], keyFn: (trade: Trade) => string) {
  const groups = new Map<string, Trade[]>();

  trades.forEach((trade) => {
    const key = keyFn(trade) || "Unassigned";
    groups.set(key, [...(groups.get(key) ?? []), trade]);
  });

  return Array.from(groups, ([name, groupTrades]) => ({
    name,
    trades: groupTrades.length,
    winRate: calculateWinRate(groupTrades),
    netProfitLoss: sum(groupTrades.map((trade) => trade.netProfitLoss)),
    averageR: calculateAverageR(groupTrades),
    profitFactor: calculateProfitFactor(groupTrades),
  }));
}

function buildCumulativeProfitCurve(trades: Trade[]) {
  let runningProfit = 0;

  return trades.map((trade) => {
    runningProfit += trade.netProfitLoss;
    return {
      tradeNumber: trade.tradeNumber,
      cumulativeProfit: round(runningProfit),
    };
  });
}

function countTextValues(values: string[]) {
  const counts = new Map<string, number>();
  values.map((value) => value.trim()).filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 10);
}

function maxBy(trades: Trade[], key: keyof Trade) {
  return trades.reduce<Trade | undefined>(
    (best, trade) => (!best || safe(trade[key]) > safe(best[key]) ? trade : best),
    undefined,
  );
}

function minBy(trades: Trade[], key: keyof Trade) {
  return trades.reduce<Trade | undefined>(
    (worst, trade) => (!worst || safe(trade[key]) < safe(worst[key]) ? trade : worst),
    undefined,
  );
}

function maxByValue<T>(items: T[], valueFn: (item: T) => number) {
  return items.reduce<T | undefined>(
    (best, item) => (!best || valueFn(item) > valueFn(best) ? item : best),
    undefined,
  );
}

function minByValue<T>(items: T[], valueFn: (item: T) => number) {
  return items.reduce<T | undefined>(
    (worst, item) => (!worst || valueFn(item) < valueFn(worst) ? item : worst),
    undefined,
  );
}

function calculateGrowthPercentFromBalances(startingBalance: number, endingBalance: number) {
  return startingBalance > 0 ? round(((endingBalance - startingBalance) / startingBalance) * 100) : 0;
}

function average(values: number[]) {
  return values.length ? round(sum(values) / values.length) : 0;
}

function sum(values: number[]) {
  return round(values.reduce((total, value) => total + safe(value), 0));
}

function safe(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
