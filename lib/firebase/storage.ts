import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/config";
import type { ScreenshotSlot } from "@/types";

function requireStorage() {
  const storage = getFirebaseStorage();

  if (!storage) {
    throw new Error("Firebase Storage is not configured. Add Firebase values to the environment.");
  }

  return storage;
}

export async function uploadTradeScreenshot(
  userId: string,
  tradeId: string,
  slot: ScreenshotSlot,
  file: File,
) {
  const fileName = slot === "beforeEntry" ? "before.jpg" : "after.jpg";
  const storageRef = ref(
    requireStorage(),
    `screenshots/${userId}/${tradeId}/${fileName}`,
  );

  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function uploadStrategyScreenshot(userId: string, strategyId: string, file: File) {
  const storageRef = ref(
    requireStorage(),
    `strategyScreenshots/${userId}/${strategyId}/example.jpg`,
  );

  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export function deleteStorageFile(path: string) {
  return deleteObject(ref(requireStorage(), path));
}
