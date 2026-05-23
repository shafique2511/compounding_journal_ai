import { listUserDocuments, saveUserSettings } from "@/lib/supabase";
import { DEFAULT_SETTINGS } from "@/store";
import type { AppSettings } from "@/types";

export async function getSettings(userId: string) {
  const settingsRows = await listUserDocuments<(Partial<AppSettings> & { id: string })>(
    userId,
    "settings",
  );
  return { ...DEFAULT_SETTINGS, ...settingsRows[0] } satisfies AppSettings;
}

export async function createDefaultSettings(userId: string) {
  await saveUserSettings(userId, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function updateSettings(userId: string, settings: AppSettings) {
  return saveUserSettings(userId, settings);
}

export async function updateRiskSettings(
  userId: string,
  riskSettings: Pick<
    AppSettings,
    | "enableRiskWarning"
    | "maxDailyLossPercent"
    | "maxLosingStreakWarning"
    | "maxRiskPerTradePercent"
    | "maxTradesPerDay"
    | "maxWeeklyLossPercent"
    | "minimumRiskRewardRatio"
  >,
) {
  const settings = await getSettings(userId);
  return updateSettings(userId, { ...settings, ...riskSettings });
}

export async function updateAiSettings(
  userId: string,
  aiSettings: Pick<
    AppSettings,
    "aiModel" | "aiProvider" | "enableScreenshotAnalysis" | "saveAiAnalysisHistory"
  >,
) {
  const settings = await getSettings(userId);
  return updateSettings(userId, { ...settings, ...aiSettings });
}

export async function updateAppearanceSettings(
  userId: string,
  appearanceSettings: Pick<AppSettings, "accentColor" | "themeMode">,
) {
  const settings = await getSettings(userId);
  return updateSettings(userId, { ...settings, ...appearanceSettings });
}

export const settingsService = {
  createDefaultSettings,
  getSettings,
  updateAiSettings,
  updateAppearanceSettings,
  updateRiskSettings,
  updateSettings,
};
