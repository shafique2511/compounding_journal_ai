import {
  calculateCumulativeProfit,
  calculateLossRate,
  calculateMaxDrawdown,
  calculateMistakeTagStats,
  calculateProfitFactor,
  calculateRuleDisciplineScore,
  calculateWinRate,
} from "@/lib/calculations";
import type { AiAnalysis, FilterPreset, Strategy, Trade } from "@/types";

export function exportTradesToCsv(trades: Trade[]) {
  return toCsv(
    [
      "Trade Number",
      "Date",
      "Time",
      "Symbol",
      "Direction",
      "Timeframe",
      "Entry Price",
      "Stop Loss",
      "Take Profit",
      "Lot Size",
      "Risk Amount",
      "Gross Profit/Loss",
      "Commission",
      "Swap",
      "Net Profit/Loss",
      "Withdrawal Amount",
      "Starting Balance",
      "Ending Balance",
      "Growth %",
      "RR Ratio",
      "R Multiple",
      "Status",
      "Strategy",
      "Setup Type",
      "Emotion Before",
      "Emotion After",
      "Mistake Made",
      "Lesson Learned",
      "Notes",
      "Checklist Score",
      "Checklist Status",
      "Mistake Tags",
      "Rule Followed",
      "Rule Broken Notes",
      "Trade Quality Score",
      "Trade Quality Grade",
      "Review Completed",
      "Review Date",
      "Review Notes",
    ],
    trades.map((trade) => [
      trade.tradeNumber,
      trade.date,
      trade.time,
      trade.symbol,
      trade.direction,
      trade.timeframe,
      trade.entryPrice,
      trade.stopLoss,
      trade.takeProfit,
      trade.lotSize,
      trade.riskAmount,
      trade.grossProfitLoss,
      trade.commission,
      trade.swap,
      trade.netProfitLoss,
      trade.withdrawalAmount,
      trade.startingBalance,
      trade.endingBalance,
      trade.growthPercent,
      trade.riskRewardRatio,
      trade.rMultiple,
      trade.status,
      trade.strategyName,
      trade.setupType,
      trade.emotionBefore,
      trade.emotionAfter,
      trade.mistakeMade,
      trade.lessonLearned,
      trade.notes,
      trade.checklistScore,
      trade.checklistStatus,
      trade.mistakeTags.join("; "),
      trade.ruleFollowed,
      trade.ruleBrokenNotes,
      trade.tradeQualityScore,
      trade.tradeQualityGrade,
      trade.reviewCompleted ? "Yes" : "No",
      trade.reviewDate,
      trade.reviewNotes,
    ]),
  );
}

export function exportDashboardSummaryToCsv(trades: Trade[]) {
  return toCsv(
    ["Metric", "Value"],
    [
      ["Total Trades", trades.length],
      ["Total Net Profit", calculateCumulativeProfit(trades)],
      ["Total Withdrawals", sum(trades.map((trade) => trade.withdrawalAmount))],
      ["Win Rate", calculateWinRate(trades)],
      ["Loss Rate", calculateLossRate(trades)],
      ["Profit Factor", calculateProfitFactor(trades)],
      ["Maximum Drawdown", calculateMaxDrawdown(trades)],
      ["Rule Discipline Score", calculateRuleDisciplineScore(trades)],
      ["Reviewed Trades", trades.filter((trade) => trade.reviewCompleted).length],
      ["Unreviewed Losing Trades", trades.filter((trade) => trade.status === "Loss" && !trade.reviewCompleted).length],
    ],
  );
}

export function exportAiAnalysesToCsv(aiAnalyses: AiAnalysis[]) {
  return toCsv(
    ["ID", "Provider", "Model", "Analysis Type", "Date Range", "Result", "Created At"],
    aiAnalyses.map((analysis) => [
      analysis.id,
      analysis.provider,
      analysis.model,
      analysis.analysisType,
      analysis.dateRange,
      analysis.result,
      analysis.createdAt,
    ]),
  );
}

export function exportStrategiesToCsv(strategies: Strategy[]) {
  return toCsv(
    ["Strategy Name", "Market Type", "Timeframe", "Entry Rules", "Exit Rules", "Stop Loss Rules", "Take Profit Rules", "Risk Rules", "Notes", "Active"],
    strategies.map((strategy) => [
      strategy.strategyName,
      strategy.marketType,
      strategy.timeframe,
      strategy.entryRules,
      strategy.exitRules,
      strategy.stopLossRules,
      strategy.takeProfitRules,
      strategy.riskRules,
      strategy.notes,
      strategy.isActive ? "Yes" : "No",
    ]),
  );
}

export function exportReviewReportToCsv(trades: Trade[]) {
  return toCsv(
    ["Trade Number", "Symbol", "Date", "Status", "Net Profit/Loss", "Review Completed", "Review Date", "Review Notes", "Lesson Learned", "Mistake Made"],
    trades.map((trade) => [
      trade.tradeNumber,
      trade.symbol,
      trade.date,
      trade.status,
      trade.netProfitLoss,
      trade.reviewCompleted ? "Yes" : "No",
      trade.reviewDate,
      trade.reviewNotes,
      trade.lessonLearned,
      trade.mistakeMade,
    ]),
  );
}

export function exportMistakeAnalysisToCsv(trades: Trade[]) {
  const mistakeStats = calculateMistakeTagStats(trades);
  return toCsv(
    ["Mistake Tag", "Count", "Net Profit/Loss", "Win Rate"],
    Object.entries(mistakeStats).map(([tag, count]) => {
      const taggedTrades = trades.filter((trade) => trade.mistakeTags.includes(tag));
      return [
        tag,
        count,
        sum(taggedTrades.map((trade) => trade.netProfitLoss)),
        calculateWinRate(taggedTrades),
      ];
    }),
  );
}

export function exportFilterPresetsToJson(filterPresets: FilterPreset[]) {
  return JSON.stringify(filterPresets, null, 2);
}

export function downloadFile(fileName: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + safe(value), 0);
}

function safe(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
