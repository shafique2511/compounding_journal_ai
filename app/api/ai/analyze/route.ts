import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAiInputSummary, buildAiPrompt, filterTradesForAi } from "@/lib/ai/analysis";
import {
  createFriendlyError,
  FriendlyError,
  getFriendlyErrorMessage,
  logTechnicalError,
} from "@/lib/errors/app-error";
import {
  aiAnalysisToInsert,
  settingsFromRow,
  strategyFromRow,
  tradeFromRow,
  type SettingsRow,
  type StrategyRow,
  type TradeRow,
} from "@/lib/supabase/mappers";
import { requireSupabaseServerClient } from "@/src/lib/supabase/server";
import { DEFAULT_SETTINGS } from "@/store";
import type { AiAnalysis } from "@/types";

const aiFilterSchema = z.object({
  customFrom: z.string().default(""),
  customTo: z.string().default(""),
  filter: z
    .enum([
      "all",
      "week",
      "month",
      "custom",
      "trade",
      "strategy",
      "symbol",
      "losing",
      "rule-broken",
      "low-quality",
    ])
    .default("all"),
  selectedStrategy: z.string().default(""),
  selectedSymbol: z.string().default(""),
  selectedTradeId: z.string().default(""),
});

const aiAnalyzeRequestSchema = z.object({
  filters: aiFilterSchema.default({
    customFrom: "",
    customTo: "",
    filter: "all",
    selectedStrategy: "",
    selectedSymbol: "",
    selectedTradeId: "",
  }),
  model: z.string().trim().max(100).optional(),
  provider: z.enum(["openai", "gemini"]).optional(),
});

const systemPrompt =
  "You are a professional trading journal coach. Analyze trade-by-trade compounding data, risk behavior, strategy adherence, psychology, screenshots, withdrawals, and improvement. Do not provide trade signals, do not tell the user exactly what trade to take, do not guarantee profit, do not encourage revenge trading, do not encourage overlotting, and do not give unsafe risk advice.";
const defaultGeminiModel = "gemini-2.5-flash";
const defaultOpenAiModel = "gpt-4.1-mini";

export async function POST(request: Request) {
  try {
    const parsedBody = aiAnalyzeRequestSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid AI analysis request." }, { status: 400 });
    }

    const supabase = await requireSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Login is required to run AI analysis." }, { status: 401 });
    }

    const [tradesResult, settingsResult, strategiesResult] = await Promise.all([
      supabase.from("trades").select("*").eq("user_id", user.id),
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("strategies").select("*").eq("user_id", user.id),
    ]);

    if (tradesResult.error) {
      logTechnicalError(tradesResult.error, { action: "load trades for AI", source: "database" });
      return NextResponse.json({ error: "Could not load trades for AI analysis." }, { status: 500 });
    }

    if (settingsResult.error) {
      logTechnicalError(settingsResult.error, { action: "load settings for AI", source: "database" });
      return NextResponse.json({ error: "Could not load settings for AI analysis." }, { status: 500 });
    }

    if (strategiesResult.error) {
      logTechnicalError(strategiesResult.error, { action: "load strategies for AI", source: "database" });
      return NextResponse.json({ error: "Could not load strategies for AI analysis." }, { status: 500 });
    }

    const settings = settingsResult.data
      ? { ...DEFAULT_SETTINGS, ...settingsFromRow(settingsResult.data as SettingsRow) }
      : DEFAULT_SETTINGS;
    const provider = parsedBody.data.provider ?? settings.aiProvider;
    const model = resolveAiModel(provider, parsedBody.data.model?.trim() || settings.aiModel);

    if (provider !== "openai" && provider !== "gemini") {
      return NextResponse.json(
        { error: "Select Gemini or ChatGPT / OpenAI in Settings before running AI analysis." },
        { status: 400 },
      );
    }

    const trades = ((tradesResult.data ?? []) as TradeRow[]).map(tradeFromRow);
    const strategies = ((strategiesResult.data ?? []) as StrategyRow[]).map(strategyFromRow);
    const selectedTrades = filterTradesForAi(trades, parsedBody.data.filters);

    if (selectedTrades.length === 0) {
      return NextResponse.json({ error: "No trades match the selected AI filter." }, { status: 400 });
    }

    const inputSummary = buildAiInputSummary(
      selectedTrades,
      strategies,
      settings,
      parsedBody.data.filters,
    );
    const prompt = buildAiPrompt(inputSummary);
    const result =
      provider === "openai"
        ? await analyzeWithOpenAI(prompt, model)
        : await analyzeWithGemini(prompt, model);

    const analysis = result.analysis.trim() || "AI returned an empty analysis.";

    if (settings.saveAiAnalysisHistory) {
      const analysisDocument: AiAnalysis = {
        id: crypto.randomUUID(),
        provider,
        model: result.model,
        analysisType: parsedBody.data.filters.filter,
        dateRange: formatDateRange(parsedBody.data.filters),
        inputSummary,
        result: analysis,
        createdAt: Date.now(),
      };
      const { error: saveError } = await supabase
        .from("ai_analyses")
        .insert(aiAnalysisToInsert(analysisDocument, user.id));

      if (saveError) {
        logTechnicalError(saveError, { action: "save AI analysis", source: "database" });
        return NextResponse.json(
          { error: "AI analysis completed, but history could not be saved." },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      analysis,
      inputSummary,
      model: result.model,
      provider,
    });
  } catch (error) {
    logTechnicalError(error, { action: "run AI analysis", source: "ai" });
    return NextResponse.json(
      { error: getFriendlyErrorMessage(error, "AI analysis failed. Check your provider settings and try again.") },
      { status: 500 },
    );
  }
}

async function analyzeWithOpenAI(prompt: string, requestedModel?: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw createFriendlyError("Missing OpenAI API key.", { action: "openai api key", source: "ai" });
  }

  const model = requestedModel || process.env.OPENAI_MODEL || defaultOpenAiModel;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw await createAiProviderError("OpenAI", response);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return {
    analysis: data.choices?.[0]?.message?.content ?? "",
    model,
  };
}

async function analyzeWithGemini(prompt: string, requestedModel?: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw createFriendlyError("Missing Gemini API key.", { action: "gemini api key", source: "ai" });
  }

  const model = requestedModel || process.env.GEMINI_MODEL || defaultGeminiModel;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw await createAiProviderError("Gemini", response);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  return {
    analysis: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
    model,
  };
}

function resolveAiModel(provider: "gemini" | "openai", model: string) {
  const trimmedModel = model.trim();

  if (provider === "gemini") {
    return trimmedModel.startsWith("gemini-")
      ? trimmedModel
      : process.env.GEMINI_MODEL || defaultGeminiModel;
  }

  return trimmedModel && !trimmedModel.startsWith("gemini-")
    ? trimmedModel
    : process.env.OPENAI_MODEL || defaultOpenAiModel;
}

async function createAiProviderError(provider: "Gemini" | "OpenAI", response: Response) {
  const details = await readProviderError(response);
  const message = details.toLowerCase();

  if (message.includes("api key") || message.includes("key not valid") || response.status === 401) {
    return new FriendlyError(`${provider} API key is missing or invalid. Check your Vercel environment variables.`, {
      action: `${provider.toLowerCase()} request`,
      source: "ai",
    });
  }

  if (message.includes("not found") || message.includes("model") || response.status === 404) {
    return new FriendlyError(`${provider} model is not available. Clear the AI model field or use a valid ${provider} model.`, {
      action: `${provider.toLowerCase()} request`,
      source: "ai",
    });
  }

  if (message.includes("quota") || message.includes("rate") || response.status === 429) {
    return new FriendlyError(`${provider} rate limit or quota was reached. Try again later or check your provider billing.`, {
      action: `${provider.toLowerCase()} request`,
      source: "ai",
    });
  }

  return new FriendlyError(`${provider} request failed. Check provider settings and try again.`, {
    action: `${provider.toLowerCase()} request`,
    source: "ai",
  });
}

async function readProviderError(response: Response) {
  try {
    const data = (await response.json()) as { error?: { message?: string }; message?: string };
    return data.error?.message ?? data.message ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function formatDateRange(values: z.infer<typeof aiFilterSchema>) {
  if (values.filter === "custom") {
    return `${values.customFrom || "start"} to ${values.customTo || "end"}`;
  }

  const labels: Record<z.infer<typeof aiFilterSchema>["filter"], string> = {
    all: "Analyze all trades",
    custom: "Analyze custom date range",
    losing: "Analyze losing trades only",
    "low-quality": "Analyze low quality trades only",
    month: "Analyze this month",
    "rule-broken": "Analyze rule broken trades only",
    strategy: "Analyze selected strategy",
    symbol: "Analyze selected symbol",
    trade: "Analyze selected trade only",
    week: "Analyze this week",
  };

  return labels[values.filter] ?? values.filter;
}
