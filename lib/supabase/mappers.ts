import type { AiAnalysis, AppSettings, FilterPreset, Strategy, Trade } from "@/types";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/src/types/supabase";

export type TradeRow = Tables<"trades">;
export type TradeInsert = TablesInsert<"trades">;
export type TradeUpdate = TablesUpdate<"trades">;
export type SettingsRow = Tables<"user_settings">;
export type UserSettings = AppSettings & { id: string };
export type SettingsUpdate = TablesUpdate<"user_settings"> & { user_id: string };
export type StrategyRow = Tables<"strategies">;
export type StrategyInsert = TablesInsert<"strategies">;
export type StrategyUpdate = TablesUpdate<"strategies">;
export type FilterPresetRow = Tables<"filter_presets">;
export type FilterPresetInsert = TablesInsert<"filter_presets">;
export type FilterPresetUpdate = TablesUpdate<"filter_presets">;
export type AiAnalysisRow = Tables<"ai_analyses">;
export type AiAnalysisInsert = TablesInsert<"ai_analyses">;
export type AiAnalysisUpdate = TablesUpdate<"ai_analyses">;

export function tradeFromRow(row: TradeRow): Trade {
  return {
    id: row.id,
    tradeNumber: number(row.trade_number),
    date: row.date,
    time: row.time,
    timestamp: number(row.timestamp),
    symbol: row.symbol,
    direction: row.direction === "Sell" ? "Sell" : "Buy",
    timeframe: timeframe(row.timeframe),
    entryPrice: number(row.entry_price),
    stopLoss: number(row.stop_loss),
    takeProfit: number(row.take_profit),
    lotSize: number(row.lot_size),
    riskAmount: number(row.risk_amount),
    rewardAmount: number(row.reward_amount),
    grossProfitLoss: number(row.gross_profit_loss),
    commission: number(row.commission),
    swap: number(row.swap),
    netProfitLoss: number(row.net_profit_loss),
    withdrawalAmount: number(row.withdrawal_amount),
    startingBalance: number(row.starting_balance),
    endingBalance: number(row.ending_balance),
    growthPercent: number(row.growth_percent),
    riskRewardRatio: number(row.risk_reward_ratio),
    rMultiple: number(row.r_multiple),
    status: status(row.status),
    strategyName: row.strategy_name ?? "",
    strategyId: row.strategy_id ?? undefined,
    setupType: row.setup_type ?? "",
    emotionBefore: row.emotion_before ?? "",
    emotionAfter: row.emotion_after ?? "",
    mistakeMade: row.mistake_made ?? "",
    lessonLearned: row.lesson_learned ?? "",
    notes: row.notes ?? "",
    beforeScreenshotUrl: row.before_screenshot_url ?? undefined,
    afterScreenshotUrl: row.after_screenshot_url ?? undefined,
    checklistTrendConfirmed: row.checklist_trend_confirmed ?? false,
    checklistKeyLevelConfirmed: row.checklist_key_level_confirmed ?? false,
    checklistEntryReasonConfirmed: row.checklist_entry_reason_confirmed ?? false,
    checklistStopLossPlanned: row.checklist_stop_loss_planned ?? false,
    checklistTakeProfitPlanned: row.checklist_take_profit_planned ?? false,
    checklistRiskAccepted: row.checklist_risk_accepted ?? false,
    checklistNoRevengeTrade: row.checklist_no_revenge_trade ?? false,
    checklistNoOverlot: row.checklist_no_overlot ?? false,
    checklistNewsChecked: row.checklist_news_checked ?? false,
    checklistEmotionStable: row.checklist_emotion_stable ?? false,
    checklistScore: number(row.checklist_score),
    checklistStatus: row.checklist_status === "Plan Passed" ? "Plan Passed" : "Plan Warning",
    mistakeTags: row.mistake_tags ?? [],
    ruleFollowed:
      row.rule_followed === "Yes" || row.rule_followed === "No" ? row.rule_followed : "Partially",
    ruleBrokenNotes: row.rule_broken_notes ?? "",
    tradeQualityScore: number(row.trade_quality_score),
    tradeQualityGrade: qualityGrade(row.trade_quality_grade),
    reviewCompleted: row.review_completed ?? false,
    reviewDate: row.review_date ?? "",
    reviewNotes: row.review_notes ?? "",
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

export function tradeToInsert(trade: Trade, userId: string): TradeInsert {
  return {
    id: trade.id,
    user_id: userId,
    trade_number: trade.tradeNumber,
    date: trade.date,
    time: trade.time,
    timestamp: trade.timestamp,
    symbol: trade.symbol,
    direction: trade.direction,
    timeframe: trade.timeframe,
    entry_price: trade.entryPrice,
    stop_loss: trade.stopLoss,
    take_profit: trade.takeProfit,
    lot_size: trade.lotSize,
    risk_amount: trade.riskAmount,
    reward_amount: trade.rewardAmount,
    gross_profit_loss: trade.grossProfitLoss,
    commission: trade.commission,
    swap: trade.swap,
    net_profit_loss: trade.netProfitLoss,
    withdrawal_amount: trade.withdrawalAmount,
    starting_balance: trade.startingBalance,
    ending_balance: trade.endingBalance,
    growth_percent: trade.growthPercent,
    risk_reward_ratio: trade.riskRewardRatio,
    r_multiple: trade.rMultiple,
    status: trade.status,
    strategy_name: trade.strategyName,
    strategy_id: trade.strategyId ?? null,
    setup_type: trade.setupType,
    emotion_before: trade.emotionBefore,
    emotion_after: trade.emotionAfter,
    mistake_made: trade.mistakeMade,
    lesson_learned: trade.lessonLearned,
    notes: trade.notes,
    before_screenshot_url: trade.beforeScreenshotUrl ?? null,
    after_screenshot_url: trade.afterScreenshotUrl ?? null,
    checklist_trend_confirmed: trade.checklistTrendConfirmed,
    checklist_key_level_confirmed: trade.checklistKeyLevelConfirmed,
    checklist_entry_reason_confirmed: trade.checklistEntryReasonConfirmed,
    checklist_stop_loss_planned: trade.checklistStopLossPlanned,
    checklist_take_profit_planned: trade.checklistTakeProfitPlanned,
    checklist_risk_accepted: trade.checklistRiskAccepted,
    checklist_no_revenge_trade: trade.checklistNoRevengeTrade,
    checklist_no_overlot: trade.checklistNoOverlot,
    checklist_news_checked: trade.checklistNewsChecked,
    checklist_emotion_stable: trade.checklistEmotionStable,
    checklist_score: trade.checklistScore,
    checklist_status: trade.checklistStatus,
    mistake_tags: trade.mistakeTags,
    rule_followed: trade.ruleFollowed,
    rule_broken_notes: trade.ruleBrokenNotes,
    trade_quality_score: trade.tradeQualityScore,
    trade_quality_grade: trade.tradeQualityGrade,
    review_completed: trade.reviewCompleted,
    review_date: trade.reviewDate,
    review_notes: trade.reviewNotes,
    updated_at: new Date().toISOString(),
  };
}

export function tradeToUpdate(trade: Trade, userId: string): TradeUpdate {
  return tradeToInsert(trade, userId);
}

export function settingsFromRow(row: SettingsRow): UserSettings {
  return {
    id: row.id,
    initialBalance: number(row.initial_balance),
    currency: row.currency ?? "USD",
    timezoneOffset: row.timezone_offset ?? "+00:00",
    dateFormat:
      row.date_format === "MM/DD/YYYY" || row.date_format === "YYYY-MM-DD"
        ? row.date_format
        : "DD/MM/YYYY",
    timeFormat: row.time_format === "12-hour" ? "12-hour" : "24-hour",
    autoTradeNumber: true,
    defaultTimeframe: row.default_timeframe ?? "M15",
    defaultSymbol: row.default_symbol ?? "",
    defaultCommission: number(row.default_commission),
    defaultSwap: number(row.default_swap),
    themeMode:
      row.theme_mode === "light" || row.theme_mode === "dark" ? row.theme_mode : "system",
    accentColor: row.accent_color ?? "blue",
    aiProvider: row.ai_provider === "openai" ? "openai" : "gemini",
    aiModel: row.ai_model ?? "",
    enableScreenshotAnalysis: row.enable_screenshot_analysis ?? true,
    saveAiAnalysisHistory: row.save_ai_analysis_history ?? true,
    maxRiskPerTradePercent: number(row.max_risk_per_trade_percent, 2),
    maxDailyLossPercent: number(row.max_daily_loss_percent, 5),
    maxWeeklyLossPercent: number(row.max_weekly_loss_percent, 10),
    maxTradesPerDay: number(row.max_trades_per_day, 5),
    maxLosingStreakWarning: number(row.max_losing_streak_warning, 3),
    minimumRiskRewardRatio: number(row.minimum_risk_reward_ratio, 1.5),
    enableRiskWarning: row.enable_risk_warning ?? true,
  };
}

export function settingsToUpdate(settings: AppSettings, userId: string): SettingsUpdate {
  return {
    user_id: userId,
    initial_balance: settings.initialBalance,
    currency: settings.currency,
    timezone_offset: settings.timezoneOffset,
    date_format: settings.dateFormat,
    time_format: settings.timeFormat,
    default_timeframe: settings.defaultTimeframe,
    default_symbol: settings.defaultSymbol,
    default_commission: settings.defaultCommission,
    default_swap: settings.defaultSwap,
    theme_mode: settings.themeMode,
    accent_color: settings.accentColor,
    ai_provider: settings.aiProvider,
    ai_model: settings.aiModel,
    enable_screenshot_analysis: settings.enableScreenshotAnalysis,
    save_ai_analysis_history: settings.saveAiAnalysisHistory,
    max_risk_per_trade_percent: settings.maxRiskPerTradePercent,
    max_daily_loss_percent: settings.maxDailyLossPercent,
    max_weekly_loss_percent: settings.maxWeeklyLossPercent,
    max_trades_per_day: settings.maxTradesPerDay,
    max_losing_streak_warning: settings.maxLosingStreakWarning,
    minimum_risk_reward_ratio: settings.minimumRiskRewardRatio,
    enable_risk_warning: settings.enableRiskWarning,
  };
}

export function strategyFromRow(row: StrategyRow): Strategy {
  return {
    id: row.id,
    strategyName: row.strategy_name,
    marketType: row.market_type ?? "",
    timeframe: row.timeframe ?? "",
    entryRules: row.entry_rules ?? "",
    exitRules: row.exit_rules ?? "",
    stopLossRules: row.stop_loss_rules ?? "",
    takeProfitRules: row.take_profit_rules ?? "",
    riskRules: row.risk_rules ?? "",
    exampleScreenshotUrl: row.example_screenshot_url ?? undefined,
    notes: row.notes ?? "",
    isActive: row.is_active ?? true,
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

export function strategyToInsert(strategy: Strategy, userId: string): StrategyInsert {
  return {
    id: strategy.id,
    user_id: userId,
    strategy_name: strategy.strategyName,
    market_type: strategy.marketType,
    timeframe: strategy.timeframe,
    entry_rules: strategy.entryRules,
    exit_rules: strategy.exitRules,
    stop_loss_rules: strategy.stopLossRules,
    take_profit_rules: strategy.takeProfitRules,
    risk_rules: strategy.riskRules,
    example_screenshot_url: strategy.exampleScreenshotUrl ?? null,
    notes: strategy.notes,
    is_active: strategy.isActive,
    updated_at: new Date().toISOString(),
  };
}

export function strategyToUpdate(strategy: Strategy, userId: string): StrategyUpdate {
  return strategyToInsert(strategy, userId);
}

export function filterPresetFromRow(row: FilterPresetRow): FilterPreset {
  return {
    id: row.id,
    presetName: row.preset_name,
    dateFilter: row.date_filter ?? "",
    symbolFilter: row.symbol_filter ?? "",
    timeframeFilter: row.timeframe_filter ?? "",
    strategyFilter: row.strategy_filter ?? "",
    statusFilter: row.status_filter ?? "",
    qualityGradeFilter: row.quality_grade_filter ?? "",
    ruleFollowedFilter: row.rule_followed_filter ?? "",
    createdAt: timestamp(row.created_at),
    updatedAt: timestamp(row.updated_at),
  };
}

export function filterPresetToInsert(preset: FilterPreset, userId: string): FilterPresetInsert {
  return {
    id: preset.id,
    user_id: userId,
    preset_name: preset.presetName,
    date_filter: preset.dateFilter,
    symbol_filter: preset.symbolFilter,
    timeframe_filter: preset.timeframeFilter,
    strategy_filter: preset.strategyFilter,
    status_filter: preset.statusFilter,
    quality_grade_filter: preset.qualityGradeFilter,
    rule_followed_filter: preset.ruleFollowedFilter,
    updated_at: new Date().toISOString(),
  };
}

export function filterPresetToUpdate(preset: FilterPreset, userId: string): FilterPresetUpdate {
  return filterPresetToInsert(preset, userId);
}

export function aiAnalysisFromRow(row: AiAnalysisRow): AiAnalysis {
  return {
    id: row.id,
    provider: row.provider === "openai" ? "openai" : "gemini",
    model: row.model ?? "",
    analysisType: row.analysis_type ?? "",
    dateRange: row.date_range ?? "",
    inputSummary: record(row.input_summary),
    result: row.result,
    createdAt: timestamp(row.created_at),
  };
}

export function aiAnalysisToInsert(analysis: AiAnalysis, userId: string): AiAnalysisInsert {
  return {
    id: analysis.id,
    user_id: userId,
    provider: analysis.provider,
    model: analysis.model,
    analysis_type: analysis.analysisType,
    date_range: analysis.dateRange,
    input_summary: json(analysis.inputSummary),
    result: analysis.result,
    updated_at: new Date().toISOString(),
  };
}

export function aiAnalysisToUpdate(analysis: AiAnalysis, userId: string): AiAnalysisUpdate {
  return aiAnalysisToInsert(analysis, userId);
}

function number(value: unknown, fallback = 0) {
  const parsedValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function timestamp(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsedValue = new Date(value).getTime();
    return Number.isFinite(parsedValue) ? parsedValue : Date.now();
  }
  return Date.now();
}

function timeframe(value: string): Trade["timeframe"] {
  return ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"].includes(value)
    ? (value as Trade["timeframe"])
    : "M15";
}

function status(value: string): Trade["status"] {
  return ["Win", "Loss", "Breakeven", "Running", "Cancelled"].includes(value)
    ? (value as Trade["status"])
    : "Running";
}

function qualityGrade(value: unknown): Trade["tradeQualityGrade"] {
  return value === "A+" || value === "A" || value === "B" || value === "C" ? value : "D";
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function json(value: Record<string, unknown>): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
