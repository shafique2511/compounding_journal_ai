import { deleteUserDocument, listTrades, saveTrade } from "@/lib/supabase";
import { recalculateTradesInSequence } from "@/lib/trades/trade-ledger";
import type { Trade } from "@/types";

export function createTrade(userId: string, trade: Trade) {
  return saveTrade(userId, trade);
}

export function updateTrade(userId: string, trade: Trade) {
  return saveTrade(userId, trade);
}

export function deleteTrade(userId: string, tradeId: string) {
  return deleteUserDocument(userId, "trades", tradeId);
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
  const trades = await getAllTrades(userId);
  await Promise.all(trades.map((trade) => deleteTrade(userId, trade.id)));
}

export async function recalculateTradesAfterChange(
  userId: string,
  trades: Trade[],
  initialBalance: number,
) {
  const recalculatedTrades = recalculateTradesInSequence(trades, initialBalance);
  await Promise.all(recalculatedTrades.map((trade) => saveTrade(userId, trade)));
  return recalculatedTrades;
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
