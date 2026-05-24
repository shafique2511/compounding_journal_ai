import { deleteUserDocument, deleteUserDocuments, listTrades, saveTrade } from "@/lib/supabase";
import { recalculateTradesInSequence } from "@/lib/trades/trade-ledger";
import type { Trade } from "@/types";

export async function createTrade(userId: string, trade: Trade, initialBalance?: number) {
  if (initialBalance === undefined) {
    await saveTrade(userId, trade);
    return trade;
  }

  const existingTrades = await getAllTrades(userId);
  const recalculatedTrades = await recalculateTradesAfterChange(
    userId,
    [...existingTrades.filter((item) => item.id !== trade.id), trade],
    initialBalance,
  );

  return recalculatedTrades.find((item) => item.id === trade.id) ?? trade;
}

export async function updateTrade(userId: string, trade: Trade, initialBalance?: number) {
  if (initialBalance === undefined) {
    await saveTrade(userId, trade);
    return trade;
  }

  const existingTrades = await getAllTrades(userId);
  const recalculatedTrades = await recalculateTradesAfterChange(
    userId,
    existingTrades.map((item) => (item.id === trade.id ? trade : item)),
    initialBalance,
  );

  return recalculatedTrades.find((item) => item.id === trade.id) ?? trade;
}

export async function deleteTrade(userId: string, tradeId: string, initialBalance?: number) {
  await deleteUserDocument(userId, "trades", tradeId);

  if (initialBalance === undefined) {
    return [];
  }

  const remainingTrades = (await getAllTrades(userId)).filter((trade) => trade.id !== tradeId);
  return recalculateTradesAfterChange(userId, remainingTrades, initialBalance);
}

export async function getTradeById(userId: string, tradeId: string) {
  const trades = await getAllTrades(userId);
  return trades.find((trade) => trade.id === tradeId) ?? null;
}

export function getAllTrades(userId: string) {
  return listTrades(userId);
}

export async function getTradesByDateRange(userId: string, from: string, to: string) {
  return (await getAllTrades(userId)).filter(
    (trade) => (!from || trade.date >= from) && (!to || trade.date <= to),
  );
}

export async function getTradesBySymbol(userId: string, symbol: string) {
  return (await getAllTrades(userId)).filter((trade) => trade.symbol === symbol);
}

export async function getTradesByTimeframe(userId: string, timeframe: string) {
  return (await getAllTrades(userId)).filter((trade) => trade.timeframe === timeframe);
}

export async function getTradesByStatus(userId: string, status: string) {
  return (await getAllTrades(userId)).filter((trade) => trade.status === status);
}

export async function getTradesByStrategy(userId: string, strategy: string) {
  return (await getAllTrades(userId)).filter(
    (trade) => trade.strategyId === strategy || trade.strategyName === strategy,
  );
}

export async function getTradesByQualityGrade(userId: string, qualityGrade: string) {
  return (await getAllTrades(userId)).filter((trade) => trade.tradeQualityGrade === qualityGrade);
}

export async function getTradesByRuleFollowed(userId: string, ruleFollowed: string) {
  return (await getAllTrades(userId)).filter((trade) => trade.ruleFollowed === ruleFollowed);
}

export async function getTradesByReviewStatus(userId: string, reviewCompleted: boolean) {
  return (await getAllTrades(userId)).filter((trade) => trade.reviewCompleted === reviewCompleted);
}

export async function getTradesByMistakeTag(userId: string, mistakeTag: string) {
  return (await getAllTrades(userId)).filter((trade) => trade.mistakeTags.includes(mistakeTag));
}

export async function deleteAllTrades(userId: string) {
  await deleteUserDocuments(userId, "trades");
}

export async function recalculateTradesAfterChange(
  userId: string,
  trades: Trade[],
  initialBalance: number,
) {
  const recalculatedTrades = recalculateTradesInSequence(trades, initialBalance);
  return syncRecalculatedTrades(userId, recalculatedTrades);
}

async function syncRecalculatedTrades(userId: string, trades: Trade[]) {
  const response = await fetch("/api/trades/sync", {
    body: JSON.stringify({ trades }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; trades?: Trade[] };

  if (!response.ok || data.error) {
    throw new Error(data.error || "Trades could not be saved to Supabase.");
  }

  return data.trades ?? trades;
}

export const tradeService = {
  createTrade,
  deleteAllTrades,
  deleteTrade,
  getAllTrades,
  getTradeById,
  getTradesByDateRange,
  getTradesByMistakeTag,
  getTradesByQualityGrade,
  getTradesByReviewStatus,
  getTradesByRuleFollowed,
  getTradesByStatus,
  getTradesByStrategy,
  getTradesBySymbol,
  getTradesByTimeframe,
  recalculateTradesAfterChange,
  updateTrade,
};
