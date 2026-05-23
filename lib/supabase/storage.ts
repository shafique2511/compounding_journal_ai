import { STORAGE_BUCKETS, requireSupabaseClient } from "@/lib/supabase/config";
import type { ScreenshotSlot } from "@/types";

const signedUrlTtlSeconds = 60 * 60 * 24 * 365;

export async function uploadTradeScreenshot(
  userId: string,
  tradeId: string,
  slot: ScreenshotSlot,
  file: File,
) {
  const fileName = slot === "beforeEntry" ? "before.jpg" : "after.jpg";
  const path = `${userId}/${tradeId}/${fileName}`;
  return uploadFile(STORAGE_BUCKETS.tradeScreenshots, path, file);
}

export function uploadStrategyScreenshot(userId: string, strategyId: string, file: File) {
  return uploadFile(STORAGE_BUCKETS.strategyScreenshots, `${userId}/${strategyId}/example.jpg`, file);
}

export function uploadBackupFile(userId: string, timestamp: string, file: File) {
  return uploadFile(STORAGE_BUCKETS.backups, `${userId}/backup-${timestamp}.json`, file);
}

export async function deleteStorageFile(pathOrUrl: string) {
  const storageRef = extractStorageReference(pathOrUrl);

  if (!storageRef) {
    return;
  }

  const { error } = await requireSupabaseClient()
    .storage
    .from(storageRef.bucket)
    .remove([storageRef.path]);

  if (error) {
    throw new Error(error.message);
  }
}

async function uploadFile(bucket: string, path: string, file: File) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data, error: signedUrlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, signedUrlTtlSeconds);

  if (signedUrlError) {
    throw new Error(signedUrlError.message);
  }

  return data.signedUrl;
}

function extractStorageReference(pathOrUrl: string) {
  if (!pathOrUrl) {
    return null;
  }

  if (!pathOrUrl.startsWith("http")) {
    const [bucket, ...pathParts] = pathOrUrl.split("/");
    return pathParts.length ? { bucket, path: pathParts.join("/") } : null;
  }

  const marker = pathOrUrl.includes("/storage/v1/object/sign/")
    ? "/storage/v1/object/sign/"
    : "/storage/v1/object/public/";
  const [, bucketAndPath] = pathOrUrl.split(marker);

  if (!bucketAndPath) {
    return null;
  }

  const [bucket, ...pathParts] = bucketAndPath.split("?")[0].split("/");
  const path = pathParts.join("/");

  return bucket && path ? { bucket, path } : null;
}
