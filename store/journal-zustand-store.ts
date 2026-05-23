"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AiAnalysis, AppSettings, FilterPreset, Strategy, Trade, Withdrawal } from "@/types";
import { DEFAULT_SETTINGS } from "@/store/default-state";

type JournalStore = {
  settings: AppSettings;
  trades: Trade[];
  withdrawals: Withdrawal[];
  strategies: Strategy[];
  filterPresets: FilterPreset[];
  aiAnalyses: AiAnalysis[];
  setSettings: (settings: AppSettings) => void;
  setTrades: (trades: Trade[]) => void;
  setWithdrawals: (withdrawals: Withdrawal[]) => void;
  setStrategies: (strategies: Strategy[]) => void;
  setFilterPresets: (filterPresets: FilterPreset[]) => void;
  setAiAnalyses: (aiAnalyses: AiAnalysis[]) => void;
  upsertTrade: (trade: Trade) => void;
  removeTrade: (tradeId: string) => void;
  upsertStrategy: (strategy: Strategy) => void;
  removeStrategy: (strategyId: string) => void;
  upsertFilterPreset: (filterPreset: FilterPreset) => void;
  removeFilterPreset: (filterPresetId: string) => void;
  upsertAiAnalysis: (aiAnalysis: AiAnalysis) => void;
};

export const useJournalStore = create<JournalStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      trades: [],
      withdrawals: [],
      strategies: [],
      filterPresets: [],
      aiAnalyses: [],
      setSettings: (settings) => set({ settings }),
      setTrades: (trades) => set({ trades }),
      setWithdrawals: (withdrawals) => set({ withdrawals }),
      setStrategies: (strategies) => set({ strategies }),
      setFilterPresets: (filterPresets) => set({ filterPresets }),
      setAiAnalyses: (aiAnalyses) => set({ aiAnalyses }),
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
      upsertStrategy: (strategy) =>
        set((state) => ({
          strategies: state.strategies.some((item) => item.id === strategy.id)
            ? state.strategies.map((item) => (item.id === strategy.id ? strategy : item))
            : [...state.strategies, strategy],
        })),
      removeStrategy: (strategyId) =>
        set((state) => ({
          strategies: state.strategies.filter((strategy) => strategy.id !== strategyId),
        })),
      upsertFilterPreset: (filterPreset) =>
        set((state) => ({
          filterPresets: state.filterPresets.some((item) => item.id === filterPreset.id)
            ? state.filterPresets.map((item) =>
                item.id === filterPreset.id ? filterPreset : item,
              )
            : [...state.filterPresets, filterPreset],
        })),
      removeFilterPreset: (filterPresetId) =>
        set((state) => ({
          filterPresets: state.filterPresets.filter((preset) => preset.id !== filterPresetId),
        })),
      upsertAiAnalysis: (aiAnalysis) =>
        set((state) => ({
          aiAnalyses: state.aiAnalyses.some((item) => item.id === aiAnalysis.id)
            ? state.aiAnalyses.map((item) => (item.id === aiAnalysis.id ? aiAnalysis : item))
            : [...state.aiAnalyses, aiAnalysis],
        })),
    }),
    {
      name: "trade-compounding-journal-ai-zustand",
    },
  ),
);
