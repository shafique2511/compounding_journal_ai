import { listUserDocuments, saveUserSettings } from "@/lib/supabase";
import { requireUser } from "@/src/lib/supabase/client";
import { DEFAULT_SETTINGS } from "@/store";
import type { AppSettings } from "@/types";

export async function getSettings(userId: string) {
  const user = await requireSettingsOwner(userId);
  const settingsRows = await listUserDocuments<(Partial<AppSettings> & { id: string })>(
    user.id,
    "settings",
  );

  if (!settingsRows[0]) {
    await saveUserSettings(user.id, DEFAULT_SETTINGS);
    const createdSettingsRows = await listUserDocuments<(Partial<AppSettings> & { id: string })>(
      user.id,
      "settings",
    );
    return { ...DEFAULT_SETTINGS, ...createdSettingsRows[0] } satisfies AppSettings;
  }

  return { ...DEFAULT_SETTINGS, ...settingsRows[0] } satisfies AppSettings;
}

export async function createDefaultSettings(userId: string) {
  const user = await requireSettingsOwner(userId);
  await saveUserSettings(user.id, DEFAULT_SETTINGS);
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

async function requireSettingsOwner(userId: string) {
  const user = await requireUser();

  if (user.id !== userId) {
    throw new Error("Permission blocked by database policy. Check role and RLS rules.");
  }

  return user;
}
