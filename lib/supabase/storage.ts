import { createFriendlyError } from "@/lib/errors/app-error";
import { STORAGE_BUCKETS, requireSupabaseClient } from "@/lib/supabase/config";
import { requireUser } from "@/src/lib/supabase/client";
import type { ScreenshotSlot } from "@/types";

const signedUrlTtlSeconds = 60 * 60 * 24 * 365;

export async function uploadTradeScreenshot(
  userId: string,
  tradeId: string,
  slot: ScreenshotSlot,
  file: File,
) {
  await requireStorageOwner(userId);
  return uploadFile(
    STORAGE_BUCKETS.tradeScreenshots,
    getTradeScreenshotPath(userId, tradeId, slot),
    file,
  );
}

export async function uploadStrategyScreenshot(userId: string, strategyId: string, file: File) {
  await requireStorageOwner(userId);
  return uploadFile(STORAGE_BUCKETS.strategyScreenshots, getStrategyScreenshotPath(userId, strategyId), file);
}

export async function uploadBackupFile(userId: string, timestamp: string, file: File) {
  await requireStorageOwner(userId);
  return uploadFile(STORAGE_BUCKETS.backups, `${userId}/backup-${timestamp}.json`, file);
}

export async function deleteStorageFile(pathOrUrl: string) {
  const storageRef = extractStorageReference(pathOrUrl);

  if (!storageRef) {
    return;
  }

  await requireStoragePathOwner(storageRef.path);

  const { error } = await requireSupabaseClient()
    .storage
    .from(storageRef.bucket)
    .remove([storageRef.path]);

  if (error) {
    throw createFriendlyError(error, { action: "delete storage file", source: "storage" });
  }
}

export function getTradeScreenshotPath(userId: string, tradeId: string, slot: ScreenshotSlot) {
  const fileName = slot === "beforeEntry" ? "before.jpg" : "after.jpg";
  return `${userId}/${tradeId}/${fileName}`;
}

export function getStrategyScreenshotPath(userId: string, strategyId: string) {
  return `${userId}/${strategyId}/example.jpg`;
}

async function requireStorageOwner(userId: string) {
  const user = await requireUser();

  if (user.id !== userId) {
    throw createFriendlyError("Permission blocked by database policy. Check role and RLS rules.", {
      source: "storage",
    });
  }
}

export async function requireStoragePathOwner(path: string) {
  const user = await requireUser();
  const [pathOwnerId] = path.split("/");

  if (!pathOwnerId || pathOwnerId !== user.id) {
    throw createFriendlyError("Permission blocked by database policy. Check role and RLS rules.", {
      source: "storage",
    });
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
    throw createFriendlyError(error, { action: "upload storage file", source: "storage" });
  }

  const { data, error: signedUrlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, signedUrlTtlSeconds);

  if (signedUrlError) {
    throw createFriendlyError(signedUrlError, { action: "create signed URL", source: "storage" });
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
