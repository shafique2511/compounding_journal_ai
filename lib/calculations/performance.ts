import type { Trade } from "@/types";

export function calculateWinRate(trades: Pick<Trade, "status">[]) {
  const closedTrades = trades.filter((trade) =>
    ["Win", "Loss", "Breakeven"].includes(trade.status),
  );

  if (closedTrades.length === 0) {
    return 0;
  }

  const wins = closedTrades.filter((trade) => trade.status === "Win").length;
  return Number(((wins / closedTrades.length) * 100).toFixed(2));
}

export function calculateAverageR(trades: Pick<Trade, "rMultiple">[]) {
  if (trades.length === 0) {
    return 0;
  }

  const totalR = trades.reduce((total, trade) => total + trade.rMultiple, 0);
  return Number((totalR / trades.length).toFixed(2));
}

export function calculateProfitFactor(trades: Pick<Trade, "netProfitLoss">[]) {
  const grossProfit = trades
    .filter((trade) => trade.netProfitLoss > 0)
    .reduce((total, trade) => total + trade.netProfitLoss, 0);
  const grossLoss = Math.abs(
    trades
      .filter((trade) => trade.netProfitLoss < 0)
      .reduce((total, trade) => total + trade.netProfitLoss, 0),
  );

  if (grossLoss === 0) {
    return grossProfit > 0 ? Number.POSITIVE_INFINITY : 0;
  }

  return Number((grossProfit / grossLoss).toFixed(2));
}
