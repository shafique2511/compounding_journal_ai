"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, FilterPreset, Strategy, Trade, Withdrawal } from "@/types";
import { DEFAULT_SETTINGS } from "@/store/default-state";

type JournalStore = {
  settings: AppSettings;
  trades: Trade[];
  withdrawals: Withdrawal[];
  strategies: Strategy[];
  filterPresets: FilterPreset[];
  setSettings: (settings: AppSettings) => void;
  setTrades: (trades: Trade[]) => void;
  setWithdrawals: (withdrawals: Withdrawal[]) => void;
  setStrategies: (strategies: Strategy[]) => void;
  setFilterPresets: (filterPresets: FilterPreset[]) => void;
  upsertTrade: (trade: Trade) => void;
  removeTrade: (tradeId: string) => void;
  upsertStrategy: (strategy: Strategy) => void;
  removeStrategy: (strategyId: string) => void;
  upsertFilterPreset: (filterPreset: FilterPreset) => void;
  removeFilterPreset: (filterPresetId: string) => void;
};

export const useJournalStore = create<JournalStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      trades: [],
      withdrawals: [],
      strategies: [],
      filterPresets: [],
      setSettings: (settings) => set({ settings }),
      setTrades: (trades) => set({ trades }),
      setWithdrawals: (withdrawals) => set({ withdrawals }),
      setStrategies: (strategies) => set({ strategies }),
      setFilterPresets: (filterPresets) => set({ filterPresets }),
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
    }),
    {
      name: "trade-compounding-journal-ai-zustand",
    },
  ),
);
