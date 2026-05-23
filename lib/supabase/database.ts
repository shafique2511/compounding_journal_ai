import type { PostgrestError } from "@supabase/supabase-js";
import { normalizeTradeDocument } from "@/lib/supabase/trade-defaults";
import { requireSupabaseClient } from "@/lib/supabase/config";
import { DEFAULT_SETTINGS } from "@/store/default-state";
import type { AiAnalysis, AppSettings, FilterPreset, Strategy, Trade } from "@/types";

type UserCollection = "trades" | "aiAnalyses" | "strategies" | "filterPresets" | "settings";
type SupabaseTable = "ai_analyses" | "filter_presets" | "strategies" | "trades" | "user_settings";
type DbRecord = Record<string, unknown>;

const tableMap: Record<UserCollection, SupabaseTable> = {
  aiAnalyses: "ai_analyses",
  filterPresets: "filter_presets",
  settings: "user_settings",
  strategies: "strategies",
  trades: "trades",
};

type Row = {
  id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
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

  return ((data ?? []) as Row[]).map((row) => rowToDocument<T>(row));
}

export async function listTrades(userId: string) {
  const { data, error } = await requireSupabaseClient()
    .from("trades")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throwPostgrestError(error);
  }

  return ((data ?? []) as Row[]).map((row) =>
    normalizeTradeDocument(row.id, rowToDocument<DbRecord>(row)),
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

export async function saveUserSettings(userId: string, settings: AppSettings) {
  const { error } = await requireSupabaseClient()
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        ...toDbColumns(settings, userSettingsColumns),
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

async function upsertDocument(
  userId: string,
  collectionName: UserCollection,
  documentId: string,
  data: DbRecord,
) {
  const { error } = await requireSupabaseClient()
    .from(tableMap[collectionName])
    .upsert({
      id: documentId,
      user_id: userId,
      ...toDbColumns(data),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throwPostgrestError(error);
  }
}

function throwPostgrestError(error: PostgrestError): never {
  throw new Error(error.message || "Supabase database request failed.");
}

function rowToDocument<T extends DbRecord>(row: Row) {
  const document: DbRecord = {};

  Object.entries(row).forEach(([key, value]) => {
    if (key === "user_id" || key === "created_at" || key === "updated_at") {
      return;
    }

    document[toCamelCase(key)] = value;
  });

  return document as T;
}

const userSettingsColumns = new Set([
  "initial_balance",
  "currency",
  "timezone_offset",
  "date_format",
  "time_format",
  "default_timeframe",
  "default_symbol",
  "default_commission",
  "default_swap",
  "theme_mode",
  "accent_color",
  "ai_provider",
  "ai_model",
  "enable_screenshot_analysis",
  "save_ai_analysis_history",
  "max_risk_per_trade_percent",
  "max_daily_loss_percent",
  "max_weekly_loss_percent",
  "max_trades_per_day",
  "max_losing_streak_warning",
  "minimum_risk_reward_ratio",
  "enable_risk_warning",
]);

function toDbColumns(data: DbRecord, allowedColumns?: Set<string>) {
  const columns: DbRecord = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || key === "createdAt" || key === "updatedAt") {
      return;
    }

    const columnName = toSnakeCase(key);

    if (!allowedColumns || allowedColumns.has(columnName)) {
      columns[columnName] = value;
    }
  });

  return columns;
}

function toSnakeCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCase(value: string) {
  return value.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}
