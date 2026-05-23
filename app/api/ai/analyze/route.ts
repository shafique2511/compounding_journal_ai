import { NextResponse } from "next/server";
import { z } from "zod";

const aiAnalyzeRequestSchema = z.object({
  provider: z.enum(["openai", "gemini"]),
  model: z.string().trim().max(100).optional(),
  prompt: z.string().trim().min(1).max(20_000),
});

export async function POST(request: Request) {
  const parsedBody = aiAnalyzeRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid AI analysis request." }, { status: 400 });
  }

  const { model, provider, prompt } = parsedBody.data;

  if (provider === "openai") {
    return analyzeWithOpenAI(prompt, model);
  }

  return analyzeWithGemini(prompt, model);
}

async function analyzeWithOpenAI(prompt: string, requestedModel?: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key is not configured." }, { status: 503 });
  }

  const model = requestedModel || process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a trading journal coach. Analyze trade-by-trade compounding data, risk behavior, strategy adherence, psychology, screenshots, withdrawals, and improvement. Do not provide trade signals, guarantee profit, encourage revenge trading, encourage overlotting, or give unsafe risk advice.",
        },
        { role: "user", content: prompt },
      ],
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "OpenAI analysis failed." }, { status: response.status });
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return NextResponse.json({
    provider: "openai",
    model,
    analysis: data.choices?.[0]?.message?.content ?? "",
  });
}

async function analyzeWithGemini(prompt: string, requestedModel?: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 503 });
  }

  const model = requestedModel || process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a trading journal coach. Analyze trade-by-trade compounding data, risk behavior, strategy adherence, psychology, screenshots, withdrawals, and improvement. Do not provide trade signals, guarantee profit, encourage revenge trading, encourage overlotting, or give unsafe risk advice.\n\n${prompt}`,
              },
            ],
          },
        ],
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    return NextResponse.json({ error: "Gemini analysis failed." }, { status: response.status });
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  return NextResponse.json({
    provider: "gemini",
    model,
    analysis: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
  });
}
