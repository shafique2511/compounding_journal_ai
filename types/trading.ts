export type TradeDirection = "Buy" | "Sell";

export type TradeTimeframe = "M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1" | "W1" | "MN1";

export type TradeStatus = "Win" | "Loss" | "Breakeven" | "Running" | "Cancelled";

export type ChecklistStatus = "Plan Passed" | "Plan Warning";

export type RuleFollowed = "Yes" | "No" | "Partially";

export type TradeQualityGrade = "A+" | "A" | "B" | "C" | "D";

export type ScreenshotSlot = "beforeEntry" | "afterEntry";

export type AiProvider = "openai" | "gemini";

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export type TimeFormat = "12-hour" | "24-hour";

export type TradeScreenshot = {
  id: string;
  slot: ScreenshotSlot;
  name: string;
  dataUrl: string;
  createdAtLocal: string;
};

export type Trade = {
  id: string;
  tradeNumber: number;
  date: string;
  time: string;
  timestamp: number;
  symbol: string;
  direction: TradeDirection;
  timeframe: TradeTimeframe;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskAmount: number;
  rewardAmount: number;
  grossProfitLoss: number;
  commission: number;
  swap: number;
  netProfitLoss: number;
  withdrawalAmount: number;
  startingBalance: number;
  endingBalance: number;
  growthPercent: number;
  riskRewardRatio: number;
  rMultiple: number;
  status: TradeStatus;
  strategyName: string;
  strategyId?: string;
  setupType: string;
  emotionBefore: string;
  emotionAfter: string;
  mistakeMade: string;
  lessonLearned: string;
  notes: string;
  beforeScreenshotUrl?: string;
  afterScreenshotUrl?: string;
  checklistTrendConfirmed: boolean;
  checklistKeyLevelConfirmed: boolean;
  checklistEntryReasonConfirmed: boolean;
  checklistStopLossPlanned: boolean;
  checklistTakeProfitPlanned: boolean;
  checklistRiskAccepted: boolean;
  checklistNoRevengeTrade: boolean;
  checklistNoOverlot: boolean;
  checklistNewsChecked: boolean;
  checklistEmotionStable: boolean;
  checklistScore: number;
  checklistStatus: ChecklistStatus;
  mistakeTags: string[];
  ruleFollowed: RuleFollowed;
  ruleBrokenNotes: string;
  tradeQualityScore: number;
  tradeQualityGrade: TradeQualityGrade;
  reviewCompleted: boolean;
  reviewDate: string;
  reviewNotes: string;
  createdAt: number;
  updatedAt: number;
};

export type Withdrawal = {
  id: string;
  amount: number;
  withdrawnAtLocal: string;
  timezoneOffsetMinutes: number;
  note?: string;
  createdAtLocal: string;
};

export type Strategy = {
  id: string;
  strategyName: string;
  marketType: string;
  timeframe: string;
  entryRules: string;
  exitRules: string;
  stopLossRules: string;
  takeProfitRules: string;
  riskRules: string;
  exampleScreenshotUrl?: string;
  notes: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

export type AiAnalysis = {
  id: string;
  provider: AiProvider;
  model: string;
  analysisType: string;
  dateRange: string;
  inputSummary: Record<string, unknown>;
  result: string;
  createdAt: number;
};

export type FilterPreset = {
  id: string;
  presetName: string;
  dateFilter: string;
  symbolFilter: string;
  timeframeFilter: string;
  strategyFilter: string;
  statusFilter: string;
  qualityGradeFilter: string;
  ruleFollowedFilter: string;
  createdAt: number;
  updatedAt: number;
};

export type AppSettings = {
  initialBalance: number;
  currency: string;
  timezoneOffset: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  autoTradeNumber: boolean;
  defaultTimeframe: string;
  defaultSymbol: string;
  defaultCommission: number;
  defaultSwap: number;
  themeMode: "light" | "dark" | "system";
  accentColor: string;
  aiProvider: AiProvider;
  aiModel: string;
  enableScreenshotAnalysis: boolean;
  saveAiAnalysisHistory: boolean;
  maxRiskPerTradePercent: number;
  maxDailyLossPercent: number;
  maxWeeklyLossPercent: number;
  maxTradesPerDay: number;
  maxLosingStreakWarning: number;
  minimumRiskRewardRatio: number;
  enableRiskWarning: boolean;
};

export type JournalState = {
  settings: AppSettings;
  trades: Trade[];
  withdrawals: Withdrawal[];
  strategies: Strategy[];
  filterPresets: FilterPreset[];
};
