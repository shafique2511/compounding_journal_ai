"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { saveTrade } from "@/lib/firebase";
import {
  createTradeFromForm,
  getTradeFormDefaults,
  recalculateTradesInSequence,
  type TradeFormValues,
} from "@/lib/trades/trade-ledger";
import { useJournalStore } from "@/store";
import type { Trade } from "@/types";

const timeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"];
const statuses = ["Win", "Loss", "Breakeven", "Running", "Cancelled"];
const ruleStatuses = ["Yes", "No", "Partially"];
const checklistFields: { name: keyof TradeFormValues; label: string }[] = [
  { name: "checklistTrendConfirmed", label: "Trend confirmed" },
  { name: "checklistKeyLevelConfirmed", label: "Key level confirmed" },
  { name: "checklistEntryReasonConfirmed", label: "Entry reason confirmed" },
  { name: "checklistStopLossPlanned", label: "Stop loss planned" },
  { name: "checklistTakeProfitPlanned", label: "Take profit planned" },
  { name: "checklistRiskAccepted", label: "Risk accepted" },
  { name: "checklistNoRevengeTrade", label: "No revenge trade" },
  { name: "checklistNoOverlot", label: "No overlot" },
  { name: "checklistNewsChecked", label: "News checked" },
  { name: "checklistEmotionStable", label: "Emotion stable" },
];

type TradeFormProps = {
  trade?: Trade;
};

type TradeFormInput = Omit<TradeFormValues, "mistakeTags"> & {
  mistakeTags: string;
};

export function TradeForm({ trade }: TradeFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { settings, trades, setTrades } = useJournalStore();
  const form = useForm<TradeFormInput>({
    defaultValues: {
      ...getTradeFormDefaults(settings, trade),
      mistakeTags: trade?.mistakeTags.join(", ") ?? "",
    },
  });

  async function handleSubmit(values: TradeFormInput) {
    const nextTrade = createTradeFromForm(
      {
        ...values,
        mistakeTags: splitTags(String(values.mistakeTags)),
      },
      trade,
    );
    const mergedTrades = trades.some((item) => item.id === nextTrade.id)
      ? trades.map((item) => (item.id === nextTrade.id ? nextTrade : item))
      : [...trades, nextTrade];
    const recalculatedTrades = recalculateTradesInSequence(
      mergedTrades,
      settings.initialBalance,
    );

    setTrades(recalculatedTrades);

    if (user) {
      await Promise.all(recalculatedTrades.map((item) => saveTrade(user.uid, item)));
    }

    router.push("/journal");
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Trade Details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Input label="Date" type="date" {...form.register("date")} />
          <Input label="Time" type="time" {...form.register("time")} />
          <Input label="Symbol" {...form.register("symbol")} />
          <Select label="Direction" {...form.register("direction")}>
            <option>Buy</option>
            <option>Sell</option>
          </Select>
          <Select label="Timeframe" {...form.register("timeframe")}>
            {timeframes.map((timeframe) => (
              <option key={timeframe}>{timeframe}</option>
            ))}
          </Select>
          <Select label="Status" {...form.register("status")}>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
          <Input label="Entry Price" type="number" step="any" {...form.register("entryPrice", { valueAsNumber: true })} />
          <Input label="Stop Loss" type="number" step="any" {...form.register("stopLoss", { valueAsNumber: true })} />
          <Input label="Take Profit" type="number" step="any" {...form.register("takeProfit", { valueAsNumber: true })} />
          <Input label="Lot Size" type="number" step="any" {...form.register("lotSize", { valueAsNumber: true })} />
          <Input label="Risk Amount" type="number" step="any" {...form.register("riskAmount", { valueAsNumber: true })} />
          <Input label="Gross Profit/Loss" type="number" step="any" {...form.register("grossProfitLoss", { valueAsNumber: true })} />
          <Input label="Commission" type="number" step="any" {...form.register("commission", { valueAsNumber: true })} />
          <Input label="Swap" type="number" step="any" {...form.register("swap", { valueAsNumber: true })} />
          <Input label="Withdrawal Amount" type="number" step="any" {...form.register("withdrawalAmount", { valueAsNumber: true })} />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Strategy and Review</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Strategy Name" {...form.register("strategyName")} />
          <Input label="Setup Type" {...form.register("setupType")} />
          <Input label="Emotion Before" {...form.register("emotionBefore")} />
          <Input label="Emotion After" {...form.register("emotionAfter")} />
          <Input label="Before Screenshot URL" {...form.register("beforeScreenshotUrl")} />
          <Input label="After Screenshot URL" {...form.register("afterScreenshotUrl")} />
          <Input label="Mistake Tags" placeholder="FOMO, overlot, late entry" {...form.register("mistakeTags")} />
          <Select label="Rule Followed" {...form.register("ruleFollowed")}>
            {ruleStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </div>
        <div className="mt-4 grid gap-4">
          <Textarea label="Mistake Made" {...form.register("mistakeMade")} />
          <Textarea label="Lesson Learned" {...form.register("lessonLearned")} />
          <Textarea label="Rule Broken Notes" {...form.register("ruleBrokenNotes")} />
          <Textarea label="Notes" {...form.register("notes")} />
          <Textarea label="Review Notes" {...form.register("reviewNotes")} />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Execution Checklist</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {checklistFields.map((field) => (
            <label className="flex items-center gap-2 rounded-md border bg-background p-3 text-sm" key={field.name}>
              <input className="size-4" type="checkbox" {...form.register(field.name)} />
              {field.label}
            </label>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button onClick={() => router.push("/journal")} type="button" variant="secondary">
          Cancel
        </Button>
        <Button type="submit">
          <Save aria-hidden="true" className="size-4" />
          Save Trade
        </Button>
      </div>
    </form>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <input className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...props} />
    </label>
  );
}

function Select({ label, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <select className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...props} />
    </label>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...props} />
    </label>
  );
}

function splitTags(value: string | string[]) {
  if (Array.isArray(value)) {
    return value;
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
