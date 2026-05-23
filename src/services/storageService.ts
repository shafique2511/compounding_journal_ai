import { STORAGE_BUCKETS, requireSupabaseClient } from "@/lib/supabase/config";
import {
  deleteStorageFile,
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
  const fileName = slot === "beforeEntry" ? "before.jpg" : "after.jpg";
  return deleteStorageFile(`${STORAGE_BUCKETS.tradeScreenshots}/${userId}/${tradeId}/${fileName}`);
}

export function uploadStrategyScreenshot(userId: string, strategyId: string, file: File) {
  return uploadStrategyImage(userId, strategyId, file);
}

export function deleteStrategyScreenshot(userId: string, strategyId: string) {
  return deleteStorageFile(`${STORAGE_BUCKETS.strategyScreenshots}/${userId}/${strategyId}/example.jpg`);
}

export async function createSignedUrl(bucket: string, path: string, expiresIn = 60 * 60 * 24 * 365) {
  const { data, error } = await requireSupabaseClient()
    .storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(error.message);
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
