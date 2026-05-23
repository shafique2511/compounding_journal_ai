import type { Trade, Withdrawal } from "@/types";

export type BalancePoint = {
  id: string;
  type: "trade" | "withdrawal";
  localDateTime: string;
  change: number;
  endingBalance: number;
};

type LedgerEvent =
  | { id: string; type: "trade"; localDateTime: string; change: number }
  | { id: string; type: "withdrawal"; localDateTime: string; change: number };

export function calculateNetProfitLoss(
  grossProfitLoss: unknown,
  commission: unknown,
  swap: unknown,
) {
  return roundMoney(toNumber(grossProfitLoss) - toNumber(commission) - toNumber(swap));
}

export function calculateEndingBalance(
  startingBalance: unknown,
  netProfitLoss: unknown,
  withdrawalAmount: unknown,
) {
  return roundMoney(toNumber(startingBalance) + toNumber(netProfitLoss) - toNumber(withdrawalAmount));
}

export function calculateGrowthPercent(netProfitLoss: unknown, startingBalance: unknown) {
  const balance = toNumber(startingBalance);

  if (balance === 0) {
    return 0;
  }

  return roundPercent((toNumber(netProfitLoss) / balance) * 100);
}

export function calculateCompoundingReturn(startingBalance: unknown, endingBalance: unknown) {
  const balance = toNumber(startingBalance);

  if (balance === 0) {
    return 0;
  }

  return roundPercent(((toNumber(endingBalance) - balance) / balance) * 100);
}

export function calculateEquityCurve(trades: Partial<Trade>[] = []) {
  return sortTrades(trades).map((trade, index) => ({
    tradeId: trade.id ?? String(index + 1),
    tradeNumber: toNumber(trade.tradeNumber, index + 1),
    timestamp: toNumber(trade.timestamp),
    equity: roundMoney(toNumber(trade.endingBalance)),
    netProfitLoss: roundMoney(toNumber(trade.netProfitLoss)),
  }));
}

export function calculateDrawdownSeries(trades: Partial<Trade>[] = []) {
  let peak = 0;

  return calculateEquityCurve(trades).map((point) => {
    peak = Math.max(peak, point.equity);
    const drawdown = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0;

    return {
      ...point,
      peak: roundMoney(peak),
      drawdownPercent: roundPercent(drawdown),
    };
  });
}

export function calculateCumulativeProfit(trades: Partial<Trade>[] = []) {
  return roundMoney(trades.reduce((total, trade) => total + toNumber(trade.netProfitLoss), 0));
}

export function calculateMaxDrawdown(trades: Partial<Trade>[] = []) {
  return calculateDrawdownSeries(trades).reduce(
    (maximum, point) => Math.max(maximum, point.drawdownPercent),
    0,
  );
}

export function calculateDailyLossUsed(trades: Partial<Trade>[] = [], date = "") {
  return roundMoney(
    trades
      .filter((trade) => !date || trade.date === date)
      .filter((trade) => toNumber(trade.netProfitLoss) < 0)
      .reduce((total, trade) => total + Math.abs(toNumber(trade.netProfitLoss)), 0),
  );
}

export function calculateWeeklyLossUsed(trades: Partial<Trade>[] = [], weekStartTimestamp = 0) {
  const weekStart = toNumber(weekStartTimestamp);
  const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;

  return roundMoney(
    trades
      .filter((trade) => {
        const timestamp = toNumber(trade.timestamp);
        return weekStart <= 0 || (timestamp >= weekStart && timestamp < weekEnd);
      })
      .filter((trade) => toNumber(trade.netProfitLoss) < 0)
      .reduce((total, trade) => total + Math.abs(toNumber(trade.netProfitLoss)), 0),
  );
}

export function buildBalanceCurve(
  startingBalance: unknown,
  trades: Partial<Trade>[] = [],
  withdrawals: Partial<Withdrawal>[] = [],
) {
  const events: LedgerEvent[] = [
    ...trades.map((trade, index) => ({
      id: trade.id ?? `trade-${index + 1}`,
      type: "trade" as const,
      localDateTime: `${trade.date ?? ""}T${trade.time ?? ""}`,
      change: toNumber(trade.netProfitLoss) - toNumber(trade.withdrawalAmount),
    })),
    ...withdrawals.map((withdrawal, index) => ({
      id: withdrawal.id ?? `withdrawal-${index + 1}`,
      type: "withdrawal" as const,
      localDateTime: withdrawal.withdrawnAtLocal ?? "",
      change: -toNumber(withdrawal.amount),
    })),
  ].sort((first, second) => first.localDateTime.localeCompare(second.localDateTime));

  let runningBalance = toNumber(startingBalance);

  return events.map<BalancePoint>((event) => {
    runningBalance = roundMoney(runningBalance + event.change);

    return {
      ...event,
      endingBalance: runningBalance,
    };
  });
}

function sortTrades(trades: Partial<Trade>[]) {
  return [...trades].sort((first, second) => toNumber(first.timestamp) - toNumber(second.timestamp));
}

function toNumber(value: unknown, fallback = 0) {
  const parsedValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
