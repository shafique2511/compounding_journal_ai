import { STORAGE_BUCKETS, requireSupabaseClient } from "@/lib/supabase/config";
import { createFriendlyError } from "@/lib/errors/app-error";
import {
  deleteStorageFile,
  getStrategyScreenshotPath,
  getTradeScreenshotPath,
  requireStoragePathOwner,
  uploadStrategyScreenshot as uploadStrategyImage,
  uploadTradeScreenshot as uploadTradeImage,
} from "@/lib/supabase/storage";
import type { ScreenshotSlot } from "@/types";

export function uploadTradeScreenshot(
  userId: string,
  tradeId: string,
  slot: ScreenshotSlot,
  file: File,
) {
  return uploadTradeImage(userId, tradeId, slot, file);
}

export function deleteTradeScreenshot(userId: string, tradeId: string, slot: ScreenshotSlot) {
  return deleteStorageFile(`${STORAGE_BUCKETS.tradeScreenshots}/${getTradeScreenshotPath(userId, tradeId, slot)}`);
}

export function uploadStrategyScreenshot(userId: string, strategyId: string, file: File) {
  return uploadStrategyImage(userId, strategyId, file);
}

export function deleteStrategyScreenshot(userId: string, strategyId: string) {
  return deleteStorageFile(`${STORAGE_BUCKETS.strategyScreenshots}/${getStrategyScreenshotPath(userId, strategyId)}`);
}

export async function createSignedUrl(bucket: string, path: string, expiresIn = 60 * 60 * 24 * 365) {
  await requireStoragePathOwner(path);
  const { data, error } = await requireSupabaseClient()
    .storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw createFriendlyError(error, { action: "create signed URL", source: "storage" });
  }

  return data.signedUrl;
}

export const storageService = {
  createSignedUrl,
  deleteStrategyScreenshot,
  deleteTradeScreenshot,
  uploadStrategyScreenshot,
  uploadTradeScreenshot,
};
