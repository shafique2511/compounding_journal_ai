import { getStorageBucket, requireSupabaseClient } from "@/lib/supabase/config";
import type { ScreenshotSlot } from "@/types";

export async function uploadTradeScreenshot(
  userId: string,
  tradeId: string,
  slot: ScreenshotSlot,
  file: File,
) {
  const fileName = slot === "beforeEntry" ? "before.jpg" : "after.jpg";
  const path = `screenshots/${userId}/${tradeId}/${fileName}`;
  return uploadFile(path, file);
}

export function uploadStrategyScreenshot(userId: string, strategyId: string, file: File) {
  return uploadFile(`strategyScreenshots/${userId}/${strategyId}/example.jpg`, file);
}

export async function deleteStorageFile(pathOrUrl: string) {
  const path = extractStoragePath(pathOrUrl);

  if (!path) {
    return;
  }

  const { error } = await requireSupabaseClient().storage.from(getStorageBucket()).remove([path]);

  if (error) {
    throw new Error(error.message);
  }
}

async function uploadFile(path: string, file: File) {
  const bucket = getStorageBucket();
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
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signedUrlError) {
    throw new Error(signedUrlError.message);
  }

  return data.signedUrl;
}

function extractStoragePath(pathOrUrl: string) {
  if (!pathOrUrl) {
    return "";
  }

  if (!pathOrUrl.startsWith("http")) {
    return pathOrUrl;
  }

  const marker = pathOrUrl.includes("/storage/v1/object/sign/")
    ? `/storage/v1/object/sign/${getStorageBucket()}/`
    : `/storage/v1/object/public/${getStorageBucket()}/`;
  const [, path] = pathOrUrl.split(marker);
  return path?.split("?")[0] ?? "";
}
