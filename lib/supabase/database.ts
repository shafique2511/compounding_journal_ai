import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { createFriendlyError } from "@/lib/errors/app-error";
import { requireSupabaseClient } from "@/lib/supabase/config";
import { DEFAULT_SETTINGS } from "@/store/default-state";
import {
  aiAnalysisFromRow,
  aiAnalysisToInsert,
  filterPresetFromRow,
  filterPresetToInsert,
  settingsFromRow,
  settingsToUpdate,
  strategyFromRow,
  strategyToInsert,
  tradeFromRow,
  tradeToInsert,
  tradeToUpdate,
  type AiAnalysisRow,
  type FilterPresetRow,
  type SettingsRow,
  type StrategyRow,
  type TradeRow,
} from "@/lib/supabase/mappers";
import type { Database } from "@/src/types/supabase";
import type { AiAnalysis, AppSettings, FilterPreset, Strategy, Trade } from "@/types";

type UserCollection = "trades" | "aiAnalyses" | "strategies" | "filterPresets" | "settings";
type SupabaseTable = "ai_analyses" | "filter_presets" | "strategies" | "trades" | "user_settings";
const tableMap: Record<UserCollection, SupabaseTable> = {
  aiAnalyses: "ai_analyses",
  filterPresets: "filter_presets",
  settings: "user_settings",
  strategies: "strategies",
  trades: "trades",
};

export async function initializeUserAccount(user: {
  id: string;
  email?: string | null;
  displayName?: string | null;
  user_metadata?: { avatar_url?: string; full_name?: string; name?: string };
}) {
  const supabase = requireSupabaseClient();
  const displayName = user.displayName ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: displayName,
        avatar_url: user.user_metadata?.avatar_url ?? "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (profileError) {
    throwPostgrestError(profileError);
  }

  await saveUserSettings(user.id, DEFAULT_SETTINGS);
}

export async function listUserDocuments<T extends { id: string }>(
  userId: string,
  collectionName: UserCollection,
) {
  const tableName = tableMap[collectionName];
  const { data, error } = await requireSupabaseClient()
    .from(tableName)
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throwPostgrestError(error);
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) =>
    mapRowByCollection(collectionName, row),
  ) as T[];
}

export async function listTrades(userId: string) {
  const { data, error } = await requireSupabaseClient()
    .from("trades")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throwPostgrestError(error);
  }

  return ((data ?? []) as TradeRow[]).map(tradeFromRow);
}

export async function saveTrade(userId: string, trade: Trade) {
  if (typeof window !== "undefined") {
    await syncTradesWithServer(userId, [trade]);
    return;
  }

  const supabase = await requireAuthenticatedOwner(userId);
  const { data: existingTrade, error: lookupError } = await supabase
    .from("trades")
    .select("id")
    .eq("id", trade.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    throwPostgrestError(lookupError);
  }

  const { error } = existingTrade
    ? await supabase
        .from("trades")
        .update(tradeToUpdate(trade, userId))
        .eq("id", trade.id)
        .eq("user_id", userId)
    : await supabase.from("trades").insert(tradeToInsert(trade, userId));

  if (error) {
    throwPostgrestError(error);
  }
}

async function syncTradesWithServer(userId: string, trades: Trade[]) {
  const response = await fetch("/api/trades/sync", {
    body: JSON.stringify({ trades, userId }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok || data.error) {
    throw createFriendlyError(data.error || "Trades could not be saved to Supabase.", {
      source: "database",
    });
  }
}

export async function saveStrategy(userId: string, strategy: Strategy) {
  const { error } = await requireSupabaseClient()
    .from("strategies")
    .upsert(strategyToInsert(strategy, userId));

  if (error) {
    throwPostgrestError(error);
  }
}

export async function saveAiAnalysis(userId: string, analysis: AiAnalysis) {
  const { error } = await requireSupabaseClient()
    .from("ai_analyses")
    .upsert(aiAnalysisToInsert(analysis, userId));

  if (error) {
    throwPostgrestError(error);
  }
}

export async function saveFilterPreset(userId: string, preset: FilterPreset) {
  const { error } = await requireSupabaseClient()
    .from("filter_presets")
    .upsert(filterPresetToInsert(preset, userId));

  if (error) {
    throwPostgrestError(error);
  }
}

export async function saveUserSettings(userId: string, settings: AppSettings) {
  const { error } = await requireSupabaseClient()
    .from("user_settings")
    .upsert(
      {
        ...settingsToUpdate(settings, userId),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    throwPostgrestError(error);
  }
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

export async function deleteUserDocuments(
  userId: string,
  collectionName: Exclude<UserCollection, "settings">,
) {
  const { error } = await requireSupabaseClient()
    .from(tableMap[collectionName])
    .delete()
    .eq("user_id", userId);

  if (error) {
    throwPostgrestError(error);
  }
}

function throwPostgrestError(error: PostgrestError): never {
  throw createFriendlyError(error, { source: "database" });
}

async function requireAuthenticatedOwner(userId: string): Promise<SupabaseClient<Database>> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw createFriendlyError(error, { action: "verify current user", source: "auth" });
  }

  if (!data.user) {
    throw createFriendlyError("User not authenticated.", { source: "auth" });
  }

  if (data.user.id !== userId) {
    throw createFriendlyError("Permission denied for this user data.", { source: "database" });
  }

  return supabase;
}

function mapRowByCollection(collectionName: UserCollection, row: Record<string, unknown>) {
  if (collectionName === "aiAnalyses") return aiAnalysisFromRow(row as AiAnalysisRow);
  if (collectionName === "filterPresets") return filterPresetFromRow(row as FilterPresetRow);
  if (collectionName === "settings") return settingsFromRow(row as SettingsRow);
  if (collectionName === "strategies") return strategyFromRow(row as StrategyRow);
  if (collectionName === "trades") return tradeFromRow(row as TradeRow);
  return row;
}
