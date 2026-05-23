import {
  deleteUserDocuments,
  listTrades,
  listUserDocuments,
  saveAiAnalysis,
  saveFilterPreset,
  saveStrategy,
  saveUserSettings,
  uploadBackupFile,
} from "@/lib/supabase";
import { createFullBackup, parseBackup, type FullBackup } from "@/lib/backup";
import { getSettings } from "@/src/services/settingsService";
import { recalculateTradesAfterChange } from "@/src/services/tradeService";
import type { AiAnalysis, FilterPreset, Strategy } from "@/types";

export function createBackup(data: Omit<FullBackup, "appVersion" | "exportedAt">) {
  return createFullBackup(data);
}

export function parseBackupJson(rawValue: string) {
  return parseBackup(rawValue);
}

export async function uploadBackup(userId: string, backup: FullBackup) {
  const timestamp = backup.exportedAt.replaceAll(/[:.]/g, "-");
  const file = new File([JSON.stringify(backup, null, 2)], `backup-${timestamp}.json`, {
    type: "application/json",
  });

  return uploadBackupFile(userId, timestamp, file);
}

export async function loadBackupData(userId: string) {
  const [settings, trades, aiAnalyses, strategies, filterPresets] = await Promise.all([
    getSettings(userId),
    listTrades(userId),
    listUserDocuments<AiAnalysis>(userId, "aiAnalyses"),
    listUserDocuments<Strategy>(userId, "strategies"),
    listUserDocuments<FilterPreset>(userId, "filterPresets"),
  ]);

  return {
    aiAnalyses,
    filterPresets,
    settings,
    strategies,
    trades,
  };
}

export async function createBackupFromSupabase(userId: string) {
  return createFullBackup(await loadBackupData(userId));
}

export async function restoreBackupToSupabase(userId: string, backup: FullBackup) {
  await Promise.all([
    deleteUserDocuments(userId, "trades"),
    deleteUserDocuments(userId, "aiAnalyses"),
    deleteUserDocuments(userId, "strategies"),
    deleteUserDocuments(userId, "filterPresets"),
  ]);

  await saveUserSettings(userId, backup.settings);
  const recalculatedTrades = await recalculateTradesAfterChange(
    userId,
    backup.trades,
    backup.settings.initialBalance,
  );

  await Promise.all([
    ...backup.aiAnalyses.map((analysis) => saveAiAnalysis(userId, analysis)),
    ...backup.strategies.map((strategy) => saveStrategy(userId, strategy)),
    ...backup.filterPresets.map((preset) => saveFilterPreset(userId, preset)),
  ]);

  return {
    ...backup,
    trades: recalculatedTrades,
  } satisfies FullBackup;
}

export const backupService = {
  createBackup,
  createBackupFromSupabase,
  loadBackupData,
  parseBackupJson,
  restoreBackupToSupabase,
  uploadBackup,
};
