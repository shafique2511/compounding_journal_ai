"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, Strategy, Trade, Withdrawal } from "@/types";
import { DEFAULT_SETTINGS } from "@/store/default-state";

type JournalStore = {
  settings: AppSettings;
  trades: Trade[];
  withdrawals: Withdrawal[];
  strategies: Strategy[];
  setSettings: (settings: AppSettings) => void;
  setTrades: (trades: Trade[]) => void;
  setWithdrawals: (withdrawals: Withdrawal[]) => void;
  setStrategies: (strategies: Strategy[]) => void;
  upsertTrade: (trade: Trade) => void;
  removeTrade: (tradeId: string) => void;
};

export const useJournalStore = create<JournalStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      trades: [],
      withdrawals: [],
      strategies: [],
      setSettings: (settings) => set({ settings }),
      setTrades: (trades) => set({ trades }),
      setWithdrawals: (withdrawals) => set({ withdrawals }),
      setStrategies: (strategies) => set({ strategies }),
      upsertTrade: (trade) =>
        set((state) => ({
          trades: state.trades.some((item) => item.id === trade.id)
            ? state.trades.map((item) => (item.id === trade.id ? trade : item))
            : [...state.trades, trade],
        })),
      removeTrade: (tradeId) =>
        set((state) => ({
          trades: state.trades.filter((trade) => trade.id !== tradeId),
        })),
    }),
    {
      name: "trade-compounding-journal-ai-zustand",
    },
  ),
);
