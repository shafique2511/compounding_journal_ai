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

export function calculateEndingBalance(
  startingBalance: number,
  trades: Pick<Trade, "netProfitLoss" | "withdrawalAmount">[],
  withdrawals: Pick<Withdrawal, "amount">[],
) {
  const tradeNetProfitLoss = trades.reduce((total, trade) => total + trade.netProfitLoss, 0);
  const tradeWithdrawalTotal = trades.reduce((total, trade) => total + trade.withdrawalAmount, 0);
  const withdrawalTotal = withdrawals.reduce((total, withdrawal) => total + withdrawal.amount, 0);

  return roundMoney(startingBalance + tradeNetProfitLoss - tradeWithdrawalTotal - withdrawalTotal);
}

export function buildBalanceCurve(
  startingBalance: number,
  trades: Pick<Trade, "id" | "date" | "time" | "netProfitLoss" | "withdrawalAmount">[],
  withdrawals: Pick<Withdrawal, "id" | "withdrawnAtLocal" | "amount">[],
) {
  const events: LedgerEvent[] = [
    ...trades.map((trade) => ({
      id: trade.id,
      type: "trade" as const,
      localDateTime: `${trade.date}T${trade.time}`,
      change: trade.netProfitLoss - trade.withdrawalAmount,
    })),
    ...withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      type: "withdrawal" as const,
      localDateTime: withdrawal.withdrawnAtLocal,
      change: -withdrawal.amount,
    })),
  ].sort((first, second) => first.localDateTime.localeCompare(second.localDateTime));

  let runningBalance = startingBalance;

  return events.map<BalancePoint>((event) => {
    runningBalance = roundMoney(runningBalance + event.change);

    return {
      ...event,
      endingBalance: runningBalance,
    };
  });
}

export function calculateCompoundingReturn(startingBalance: number, endingBalance: number) {
  if (startingBalance <= 0) {
    return 0;
  }

  return Number((((endingBalance - startingBalance) / startingBalance) * 100).toFixed(2));
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
