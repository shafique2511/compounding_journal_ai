import { NextResponse } from "next/server";
import { z } from "zod";

const aiAnalyzeRequestSchema = z.object({
  provider: z.enum(["openai", "gemini"]),
  prompt: z.string().trim().min(1).max(20_000),
});

export async function POST(request: Request) {
  const parsedBody = aiAnalyzeRequestSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid AI analysis request." }, { status: 400 });
  }

  const { provider, prompt } = parsedBody.data;

  if (provider === "openai") {
    return analyzeWithOpenAI(prompt);
  }

  return analyzeWithGemini(prompt);
}

async function analyzeWithOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key is not configured." }, { status: 503 });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You analyze a trade-by-trade compounding journal. Focus on risk behavior, strategy adherence, psychology, withdrawals, and improvement. Do not invent broker data.",
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

  return NextResponse.json({ provider: "openai", analysis: data.choices?.[0]?.message?.content ?? "" });
}

async function analyzeWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 503 });
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this trade-by-trade compounding journal. Focus on risk behavior, strategy adherence, psychology, withdrawals, and improvement. Do not invent broker data.\n\n${prompt}`,
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
    analysis: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
  });
}
