export type {
  ChecklistStatus,
  RuleFollowed,
  ScreenshotSlot,
  Trade,
  TradeDirection,
  TradeQualityGrade,
  TradeScreenshot,
  TradeStatus,
  TradeTimeframe,
  Withdrawal,
} from "@/src/types/trade";
export type { AppSettings, DateFormat, ThemeMode, TimeFormat } from "@/src/types/settings";
export type { Strategy } from "@/src/types/strategy";
export type { FilterPreset } from "@/src/types/filterPreset";
export type { AiAnalysis, AiProvider } from "@/src/types/ai";

import type { AiAnalysis } from "@/src/types/ai";
import type { FilterPreset } from "@/src/types/filterPreset";
import type { AppSettings } from "@/src/types/settings";
import type { Strategy } from "@/src/types/strategy";
import type { Trade, Withdrawal } from "@/src/types/trade";

export type JournalState = {
  settings: AppSettings;
  trades: Trade[];
  withdrawals: Withdrawal[];
  strategies: Strategy[];
  filterPresets: FilterPreset[];
  aiAnalyses: AiAnalysis[];
};
