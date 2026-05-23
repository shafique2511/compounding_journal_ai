import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  type DocumentData,
  type WithFieldValue,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import { normalizeTradeDocument } from "@/lib/firebase/trade-defaults";
import type { AiAnalysis, AppSettings, FilterPreset, Strategy, Trade } from "@/types";
import { DEFAULT_SETTINGS } from "@/store/default-state";

type UserCollection = "trades" | "aiAnalyses" | "strategies" | "filterPresets" | "settings";

function requireDb() {
  const db = getFirebaseDb();

  if (!db) {
    throw new Error("Firestore is not configured. Add Firebase values to the environment.");
  }

  return db;
}

function userCollection(userId: string, collectionName: UserCollection) {
  return collection(requireDb(), "users", userId, collectionName);
}

function userDocument(userId: string, collectionName: UserCollection, documentId: string) {
  return doc(requireDb(), "users", userId, collectionName, documentId);
}

export async function initializeUserAccount(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
}) {
  const db = requireDb();
  const createdAtLocal = new Date().toISOString();

  await setDoc(
    doc(db, "users", user.uid),
    {
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      createdAtLocal,
      updatedAtLocal: createdAtLocal,
    },
    { merge: true },
  );

  await setDoc(userDocument(user.uid, "settings", "default"), DEFAULT_SETTINGS, { merge: true });
}

export async function listUserDocuments<T extends DocumentData & { id: string }>(
  userId: string,
  collectionName: UserCollection,
) {
  const snapshot = await getDocs(userCollection(userId, collectionName));
  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  })) as unknown as T[];
}

export async function listTrades(userId: string) {
  const snapshot = await getDocs(userCollection(userId, "trades"));
  return snapshot.docs.map((documentSnapshot) =>
    normalizeTradeDocument(documentSnapshot.id, documentSnapshot.data()),
  );
}

export function saveTrade(userId: string, trade: Trade) {
  return setDoc(userDocument(userId, "trades", trade.id), trade as WithFieldValue<DocumentData>);
}

export function saveStrategy(userId: string, strategy: Strategy) {
  return setDoc(
    userDocument(userId, "strategies", strategy.id),
    strategy as WithFieldValue<DocumentData>,
  );
}

export function saveAiAnalysis(userId: string, analysis: AiAnalysis) {
  return setDoc(
    userDocument(userId, "aiAnalyses", analysis.id),
    analysis as WithFieldValue<DocumentData>,
  );
}

export function saveFilterPreset(userId: string, preset: FilterPreset) {
  return setDoc(
    userDocument(userId, "filterPresets", preset.id),
    preset as WithFieldValue<DocumentData>,
  );
}

export function saveUserSettings(userId: string, settings: AppSettings) {
  return setDoc(userDocument(userId, "settings", "default"), settings);
}

export function deleteUserDocument(
  userId: string,
  collectionName: Exclude<UserCollection, "settings">,
  documentId: string,
) {
  return deleteDoc(userDocument(userId, collectionName, documentId));
}
