import { uploadBackupFile } from "@/lib/supabase";
import { createFullBackup, parseBackup, type FullBackup } from "@/lib/backup";

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

export const backupService = {
  createBackup,
  parseBackupJson,
  uploadBackup,
};
