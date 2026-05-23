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
