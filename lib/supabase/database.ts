import type { PostgrestError } from "@supabase/supabase-js";
import { normalizeTradeDocument } from "@/lib/supabase/trade-defaults";
import { requireSupabaseClient } from "@/lib/supabase/config";
import { DEFAULT_SETTINGS } from "@/store/default-state";
import type { AiAnalysis, AppSettings, FilterPreset, Strategy, Trade } from "@/types";

type UserCollection = "trades" | "aiAnalyses" | "strategies" | "filterPresets" | "settings";
type SupabaseTable = "ai_analyses" | "filter_presets" | "settings" | "strategies" | "trades";
type JsonRecord = Record<string, unknown>;

const tableMap: Record<UserCollection, SupabaseTable> = {
  aiAnalyses: "ai_analyses",
  filterPresets: "filter_presets",
  settings: "settings",
  strategies: "strategies",
  trades: "trades",
};

type Row = {
  id: string;
  user_id: string;
  data: JsonRecord;
};

export async function initializeUserAccount(user: {
  uid?: string;
  id?: string;
  email?: string | null;
  displayName?: string | null;
  user_metadata?: { full_name?: string; name?: string };
}) {
  const userId = user.uid ?? user.id;

  if (!userId) {
    return;
  }

  const supabase = requireSupabaseClient();
  const displayName = user.displayName ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, email: user.email ?? "", display_name: displayName });

  if (profileError) {
    throwPostgrestError(profileError);
  }

  await saveUserSettings(userId, DEFAULT_SETTINGS);
}

export async function listUserDocuments<T extends { id: string }>(
  userId: string,
  collectionName: UserCollection,
) {
  const tableName = tableMap[collectionName];
  const { data, error } = await requireSupabaseClient()
    .from(tableName)
    .select("id,data")
    .eq("user_id", userId);

  if (error) {
    throwPostgrestError(error);
  }

  return ((data ?? []) as Pick<Row, "id" | "data">[]).map((row) => ({
    id: row.id,
    ...row.data,
  })) as T[];
}

export async function listTrades(userId: string) {
  const { data, error } = await requireSupabaseClient()
    .from("trades")
    .select("id,data")
    .eq("user_id", userId);

  if (error) {
    throwPostgrestError(error);
  }

  return ((data ?? []) as Pick<Row, "id" | "data">[]).map((row) =>
    normalizeTradeDocument(row.id, row.data),
  );
}

export function saveTrade(userId: string, trade: Trade) {
  return upsertDocument(userId, "trades", trade.id, trade);
}

export function saveStrategy(userId: string, strategy: Strategy) {
  return upsertDocument(userId, "strategies", strategy.id, strategy);
}

export function saveAiAnalysis(userId: string, analysis: AiAnalysis) {
  return upsertDocument(userId, "aiAnalyses", analysis.id, analysis);
}

export function saveFilterPreset(userId: string, preset: FilterPreset) {
  return upsertDocument(userId, "filterPresets", preset.id, preset);
}

export function saveUserSettings(userId: string, settings: AppSettings) {
  return upsertDocument(userId, "settings", "default", settings);
}

export async function deleteUserDocument(
  userId: string,
  collectionName: Exclude<UserCollection, "settings">,
  documentId: string,
) {
  const { error } = await requireSupabaseClient()
    .from(tableMap[collectionName])
    .delete()
    .eq("user_id", userId)
    .eq("id", documentId);

  if (error) {
    throwPostgrestError(error);
  }
}

async function upsertDocument(
  userId: string,
  collectionName: UserCollection,
  documentId: string,
  data: JsonRecord,
) {
  const { error } = await requireSupabaseClient()
    .from(tableMap[collectionName])
    .upsert({
      id: documentId,
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throwPostgrestError(error);
  }
}

function throwPostgrestError(error: PostgrestError): never {
  throw new Error(error.message || "Supabase database request failed.");
}
