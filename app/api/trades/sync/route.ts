import { NextResponse } from "next/server";
import { z } from "zod";
import { getFriendlyErrorMessage, logTechnicalError } from "@/lib/errors/app-error";
import { tradeFromRow, tradeToInsert, type TradeRow } from "@/lib/supabase/mappers";
import { requireSupabaseServerClient } from "@/src/lib/supabase/server";
import type { Trade } from "@/types";

const tradeSyncSchema = z.object({
  trades: z.array(z.custom<Trade>(isTradePayload)).default([]),
});

export async function POST(request: Request) {
  try {
    const parsedBody = tradeSyncSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Trade data is invalid." }, { status: 400 });
    }

    const userClient = await requireSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Please login first." }, { status: 401 });
    }

    const trades = parsedBody.data.trades;

    if (trades.length === 0) {
      return NextResponse.json({ trades: [] });
    }

    const { data, error } = await userClient
      .from("trades")
      .upsert(
        trades.map((trade) => ({
          ...tradeToInsert(trade, user.id),
          user_id: user.id,
        })),
        { onConflict: "id" },
      )
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: true });

    if (error) {
      logTechnicalError(error, { action: "sync trades", source: "database" });
      return NextResponse.json(
        { error: getTradeSyncErrorMessage(error.message) },
        { status: 403 },
      );
    }

    return NextResponse.json({ trades: ((data ?? []) as TradeRow[]).map(tradeFromRow) });
  } catch (caughtError) {
    logTechnicalError(caughtError, { action: "sync trades", source: "database" });
    return NextResponse.json(
      { error: getFriendlyErrorMessage(caughtError, "Trades could not be saved to Supabase.") },
      { status: 500 },
    );
  }
}

function getTradeSyncErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("row-level security") ||
    normalizedMessage.includes("permission") ||
    normalizedMessage.includes("violates policy")
  ) {
    return "Permission blocked by database policy. Check role and RLS rules.";
  }

  return "Trades could not be saved to Supabase.";
}

function isTradePayload(value: unknown): value is Trade {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const trade = value as Partial<Trade>;
  return (
    typeof trade.id === "string" &&
    typeof trade.date === "string" &&
    typeof trade.time === "string" &&
    typeof trade.symbol === "string" &&
    (trade.direction === "Buy" || trade.direction === "Sell") &&
    typeof trade.timeframe === "string" &&
    typeof trade.status === "string"
  );
}
