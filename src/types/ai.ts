export const aiProviders = ["openai", "gemini"] as const;

export type AiProvider = (typeof aiProviders)[number];

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
