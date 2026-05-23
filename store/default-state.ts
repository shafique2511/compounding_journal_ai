import type { AppSettings, JournalState } from "@/types";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  aiProvider: "openai",
  timezoneOffsetMinutes: 0,
  accountStartingBalance: 10_000,
  accountCurrency: "USD",
};

export const DEFAULT_JOURNAL_STATE: JournalState = {
  settings: DEFAULT_SETTINGS,
  trades: [],
  withdrawals: [],
  strategies: [],
};
