"use client";

import { ImagePlus, Save, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { deleteStorageFile, saveTrade, uploadTradeScreenshot } from "@/lib/firebase";
import {
  calculateChecklistScore,
  calculateChecklistStatus,
  calculateDailyLossUsed,
  calculateEndingBalance,
  calculateGrowthPercent,
  calculateNetProfitLoss,
  calculateRMultiple,
  calculateRiskRewardRatio,
  calculateStreaks,
  calculateTradeQualityGrade,
  calculateTradeQualityScore,
  calculateWeeklyLossUsed,
} from "@/lib/calculations";
import {
  createTradeFromForm,
  getTradeFormDefaults,
  recalculateTradesInSequence,
  type TradeFormValues,
} from "@/lib/trades/trade-ledger";
import { useJournalStore } from "@/store";
import type { ScreenshotSlot, Trade } from "@/types";
import { cn } from "@/lib/utils";

const timeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"];
const statuses = ["Win", "Loss", "Breakeven", "Running", "Cancelled"];
const ruleStatuses = ["Yes", "No", "Partially"];
const mistakeTagOptions = [
  "FOMO",
  "Revenge Trade",
  "Overlot",
  "Early Entry",
  "Late Entry",
  "Early Exit",
  "Late Exit",
  "Moved Stop Loss",
  "No Stop Loss",
  "Ignored Trend",
  "Ignored News",
  "Bad Risk Reward",
  "Chased Price",
  "Emotional Entry",
  "Poor Setup",
  "Other",
];
const checklistFields: { name: keyof TradeFormValues; label: string }[] = [
  { name: "checklistTrendConfirmed", label: "Trend confirmed" },
  { name: "checklistKeyLevelConfirmed", label: "Key level confirmed" },
  { name: "checklistEntryReasonConfirmed", label: "Entry reason confirmed" },
  { name: "checklistStopLossPlanned", label: "Stop loss planned" },
  { name: "checklistTakeProfitPlanned", label: "Take profit planned" },
  { name: "checklistRiskAccepted", label: "Risk amount accepted" },
  { name: "checklistNoRevengeTrade", label: "No revenge trade" },
  { name: "checklistNoOverlot", label: "No overlot" },
  { name: "checklistNewsChecked", label: "News checked" },
  { name: "checklistEmotionStable", label: "Emotion stable" },
];

type TradeFormProps = {
  trade?: Trade;
};

type TradeFormInput = Omit<TradeFormValues, "mistakeTags"> & {
  mistakeTags: string[];
};

export function TradeForm({ trade }: TradeFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { settings, strategies, trades, setTrades } = useJournalStore();
  const [error, setError] = useState("");
  const [showChecklistWarning, setShowChecklistWarning] = useState(false);
  const [pendingValues, setPendingValues] = useState<TradeFormInput | null>(null);
  const form = useForm<TradeFormInput>({
    defaultValues: {
      ...getTradeFormDefaults(settings, trade),
      mistakeTags: trade?.mistakeTags ?? [],
    },
  });
  const values = useWatch({ control: form.control });
  const [tradeId] = useState(() => trade?.id ?? crypto.randomUUID());
  const strategyNames = useMemo(
    () =>
      Array.from(
        new Set(
          strategies
            .filter((strategy) => strategy.isActive)
            .map((strategy) => strategy.strategyName)
            .filter(Boolean),
        ),
      ),
    [strategies],
  );
  const calculations = useMemo(() => {
    const netProfitLoss = calculateNetProfitLoss(values.grossProfitLoss, values.commission, values.swap);
    const endingBalance = calculateEndingBalance(
      values.startingBalance,
      netProfitLoss,
      values.withdrawalAmount,
    );
    const growthPercent = calculateGrowthPercent(netProfitLoss, values.startingBalance);
    const riskRewardRatio = calculateRiskRewardRatio(
      values.direction,
      values.entryPrice,
      values.stopLoss,
      values.takeProfit,
    );
    const rMultiple = calculateRMultiple(netProfitLoss, values.riskAmount);
    const checklistScore = calculateChecklistScore(values);
    const checklistStatus = calculateChecklistStatus(checklistScore);
    const rewardAmount =
      Math.abs(toNumber(values.takeProfit) - toNumber(values.entryPrice)) * toNumber(values.lotSize);
    const tradeQualityScore = calculateTradeQualityScore({
      ...values,
      timeframe: values.timeframe as Trade["timeframe"],
      rewardAmount,
      netProfitLoss,
      endingBalance,
      growthPercent,
      riskRewardRatio,
      rMultiple,
      checklistScore,
      checklistStatus,
    } as Partial<Trade>);

    return {
      checklistScore,
      checklistStatus,
      endingBalance,
      growthPercent,
      netProfitLoss,
      rMultiple,
      riskRewardRatio,
      rewardAmount,
      tradeQualityGrade: calculateTradeQualityGrade(tradeQualityScore),
      tradeQualityScore,
    };
  }, [values]);
  const riskWarnings = useMemo(
    () => buildRiskWarnings(values, calculations.riskRewardRatio, settings, trades, trade?.id),
    [calculations.riskRewardRatio, settings, trade?.id, trades, values],
  );

  async function handleSubmit(valuesToSubmit: TradeFormInput) {
    setError("");
    const validationError = validate(valuesToSubmit);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (calculations.checklistScore < 80) {
      setPendingValues(valuesToSubmit);
      setShowChecklistWarning(true);
      return;
    }

    await saveValues(valuesToSubmit);
  }

  async function saveValues(valuesToSave: TradeFormInput) {
    const nextTrade = createTradeFromForm(
      {
        ...valuesToSave,
        ...calculations,
        mistakeTags: valuesToSave.mistakeTags,
      },
      trade ? { ...trade, id: tradeId } : ({ id: tradeId } as Trade),
    );
    const mergedTrades = trades.some((item) => item.id === nextTrade.id)
      ? trades.map((item) => (item.id === nextTrade.id ? nextTrade : item))
      : [...trades, nextTrade];
    const recalculatedTrades = recalculateTradesInSequence(mergedTrades, settings.initialBalance);

    setTrades(recalculatedTrades);

    if (user) {
      await Promise.all(recalculatedTrades.map((item) => saveTrade(user.uid, item)));
    }

    router.push("/journal");
  }

  async function handleScreenshotUpload(slot: ScreenshotSlot, file: File | null) {
    if (!file) {
      return;
    }

    setError("");

    if (!user) {
      setError("Sign in before uploading screenshots.");
      return;
    }

    try {
      const url = await uploadTradeScreenshot(user.uid, tradeId, slot, file);
      form.setValue(slot === "beforeEntry" ? "beforeScreenshotUrl" : "afterScreenshotUrl", url, {
        shouldDirty: true,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Screenshot upload failed.");
    }
  }

  async function handleScreenshotDelete(slot: ScreenshotSlot) {
    const field = slot === "beforeEntry" ? "beforeScreenshotUrl" : "afterScreenshotUrl";
    const url = form.getValues(field);
    form.setValue(field, "", { shouldDirty: true });

    if (url) {
      await deleteStorageFile(url).catch(() => undefined);
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
      <FormHeader title={trade ? "Edit Trade" : "Add Trade"} />
      {error ? <p className="rounded-md border border-loss/30 bg-loss/10 p-3 text-sm text-loss">{error}</p> : null}
      {riskWarnings.length > 0 ? (
        <div className="rounded-md border border-withdrawal/30 bg-withdrawal/10 p-3 text-sm text-withdrawal">
          <p className="font-medium">Risk warning</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {riskWarnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      ) : null}

      <Section title="1. Trade Info">
        <Input label="Symbol" {...form.register("symbol")} />
        <Select label="Direction" {...form.register("direction")}>
          <option>Buy</option>
          <option>Sell</option>
        </Select>
        <Select label="Timeframe" {...form.register("timeframe")}>
          {timeframes.map((timeframe) => <option key={timeframe}>{timeframe}</option>)}
        </Select>
        <Input label="Date" type="date" {...form.register("date")} />
        <Input label="Time" type="time" {...form.register("time")} />
        <Select label="Status" {...form.register("status")}>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </Select>
        <Select label="Strategy dropdown" {...form.register("strategyName")}>
          <option value="">No strategy selected</option>
          {strategyNames.map((strategyName) => <option key={strategyName}>{strategyName}</option>)}
        </Select>
        <Input label="Custom strategy input" {...form.register("strategyName")} />
        <Input label="Setup Type" {...form.register("setupType")} />
      </Section>

      <Section title="2. Price Info">
        <Input label="Entry Price" type="number" step="any" {...form.register("entryPrice", { valueAsNumber: true })} />
        <Input label="Stop Loss" type="number" step="any" {...form.register("stopLoss", { valueAsNumber: true })} />
        <Input label="Take Profit" type="number" step="any" {...form.register("takeProfit", { valueAsNumber: true })} />
        <Input label="Lot Size" type="number" step="any" {...form.register("lotSize", { valueAsNumber: true })} />
      </Section>

      <Section title="3. Money Info">
        <Input label="Starting Balance" type="number" step="any" {...form.register("startingBalance", { valueAsNumber: true })} />
        <Input label="Risk Amount" type="number" step="any" {...form.register("riskAmount", { valueAsNumber: true })} />
        <ReadOnlyMetric label="Reward Amount" value={calculations.rewardAmount} />
        <Input label="Gross Profit/Loss" type="number" step="any" {...form.register("grossProfitLoss", { valueAsNumber: true })} />
        <Input label="Commission" type="number" step="any" {...form.register("commission", { valueAsNumber: true })} />
        <Input label="Swap" type="number" step="any" {...form.register("swap", { valueAsNumber: true })} />
        <ReadOnlyMetric label="Net Profit/Loss" value={calculations.netProfitLoss} />
        <Input label="Withdrawal Amount" type="number" step="any" {...form.register("withdrawalAmount", { valueAsNumber: true })} />
        <ReadOnlyMetric label="Ending Balance" value={calculations.endingBalance} />
        <ReadOnlyMetric label="Growth %" value={calculations.growthPercent} suffix="%" />
        <ReadOnlyMetric label="Risk Reward Ratio" value={calculations.riskRewardRatio} />
        <ReadOnlyMetric label="R Multiple" value={calculations.rMultiple} />
      </Section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">4. Trade Plan Checklist</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {checklistFields.map((field) => (
            <label className="flex items-center gap-2 rounded-md border bg-background p-3 text-sm" key={field.name}>
              <input className="size-4" type="checkbox" {...form.register(field.name)} />
              {field.label}
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ReadOnlyMetric label="Checklist Score" value={calculations.checklistScore} suffix="%" />
          <div className="rounded-md border bg-background p-3">
            <p className="text-xs text-muted-foreground">Checklist Status</p>
            <p className={cn("mt-1 font-semibold", calculations.checklistScore >= 80 ? "text-profit" : "text-withdrawal")}>
              {calculations.checklistStatus}
            </p>
          </div>
        </div>
      </section>

      <Section title="5. Rule Discipline">
        <Select label="Rule Followed" {...form.register("ruleFollowed")}>
          {ruleStatuses.map((status) => <option key={status}>{status}</option>)}
        </Select>
        <Textarea label="Rule Broken Notes" {...form.register("ruleBrokenNotes")} />
      </Section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">6. Mistake Tags</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {mistakeTagOptions.map((tag) => (
            <label className="flex items-center gap-2 rounded-md border bg-background p-3 text-sm" key={tag}>
              <input type="checkbox" value={tag} {...form.register("mistakeTags")} />
              {tag}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">7. Psychology</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Emotion Before" {...form.register("emotionBefore")} />
          <Input label="Emotion After" {...form.register("emotionAfter")} />
        </div>
        <div className="mt-4 grid gap-4">
          <Textarea label="Mistake Made" {...form.register("mistakeMade")} />
          <Textarea label="Lesson Learned" {...form.register("lessonLearned")} />
          <Textarea label="Notes" {...form.register("notes")} />
          <Textarea label="Review Notes" {...form.register("reviewNotes")} />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">8. Screenshots</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ScreenshotField
            label="Screenshot Before Entry"
            onDelete={() => handleScreenshotDelete("beforeEntry")}
            onUpload={(file) => handleScreenshotUpload("beforeEntry", file)}
            url={values.beforeScreenshotUrl}
          />
          <ScreenshotField
            label="Screenshot After Entry"
            onDelete={() => handleScreenshotDelete("afterEntry")}
            onUpload={(file) => handleScreenshotUpload("afterEntry", file)}
            url={values.afterScreenshotUrl}
          />
        </div>
      </section>

      <div className="grid gap-3 rounded-lg border bg-card p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <ReadOnlyMetric label="Trade Quality Score" value={calculations.tradeQualityScore} />
        <div className="rounded-md border bg-background p-3">
          <p className="text-xs text-muted-foreground">Trade Quality Grade</p>
          <p className="mt-1 text-xl font-semibold text-analytics">{calculations.tradeQualityGrade}</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button onClick={() => router.push("/journal")} type="button" variant="secondary">
          Cancel
        </Button>
        <Button type="submit">
          <Save aria-hidden="true" className="size-4" />
          Save Trade
        </Button>
      </div>

      {showChecklistWarning ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-lg">
            <h3 className="text-lg font-semibold">Checklist warning</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Checklist score is below 80. The plan is marked as a warning, but you can save anyway.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button onClick={() => setShowChecklistWarning(false)} type="button" variant="secondary">
                Review Checklist
              </Button>
              <Button
                onClick={() => {
                  setShowChecklistWarning(false);
                  if (pendingValues) {
                    void saveValues(pendingValues);
                  }
                }}
                type="button"
              >
                Save Anyway
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function validate(values: TradeFormInput) {
  if (!values.symbol.trim()) {
    return "Symbol cannot be empty.";
  }

  if (!values.status) {
    return "Status must be selected.";
  }

  if (!isValidNumber(values.startingBalance) || values.startingBalance < 0) {
    return "Starting balance must be 0 or above.";
  }

  const numberFields: (keyof TradeFormInput)[] = [
    "entryPrice",
    "stopLoss",
    "takeProfit",
    "lotSize",
    "riskAmount",
    "grossProfitLoss",
    "commission",
    "swap",
    "withdrawalAmount",
  ];

  if (numberFields.some((field) => !isValidNumber(values[field]))) {
    return "Number fields must contain valid numbers.";
  }

  return "";
}

function buildRiskWarnings(
  values: Partial<TradeFormInput>,
  riskRewardRatio: number,
  settings: { enableRiskWarning: boolean; maxDailyLossPercent: number; maxLosingStreakWarning: number; maxRiskPerTradePercent: number; maxTradesPerDay: number; maxWeeklyLossPercent: number; minimumRiskRewardRatio: number },
  trades: Trade[],
  currentTradeId?: string,
) {
  if (!settings.enableRiskWarning) {
    return [];
  }

  const warnings: string[] = [];
  const startingBalance = toNumber(values.startingBalance);
  const riskAmount = toNumber(values.riskAmount);
  const riskPercent = startingBalance > 0 ? (riskAmount / startingBalance) * 100 : 0;
  const sameDayTrades = trades.filter((trade) => trade.id !== currentTradeId && trade.date === values.date);
  const dailyLossLimit = (startingBalance * settings.maxDailyLossPercent) / 100;
  const dailyLossUsed = calculateDailyLossUsed(sameDayTrades, values.date);
  const weekStart = startOfWeekTimestamp(String(values.date || ""));
  const weeklyLossLimit = (startingBalance * settings.maxWeeklyLossPercent) / 100;
  const weeklyLossUsed = calculateWeeklyLossUsed(
    trades.filter((trade) => trade.id !== currentTradeId),
    weekStart,
  );
  const streaks = calculateStreaks(trades.filter((trade) => trade.id !== currentTradeId));

  if (settings.maxRiskPerTradePercent > 0 && riskPercent > settings.maxRiskPerTradePercent) {
    warnings.push("Risk amount is above the allowed risk percentage.");
  }

  if (settings.minimumRiskRewardRatio > 0 && riskRewardRatio < settings.minimumRiskRewardRatio) {
    warnings.push("Minimum risk reward ratio is not met.");
  }

  if (settings.maxTradesPerDay > 0 && sameDayTrades.length >= settings.maxTradesPerDay) {
    warnings.push("Maximum trades per day is reached.");
  }

  if (
    settings.maxLosingStreakWarning > 0 &&
    streaks.currentLossStreak >= settings.maxLosingStreakWarning
  ) {
    warnings.push("Losing streak warning limit is reached.");
  }

  if (settings.maxDailyLossPercent > 0 && dailyLossUsed >= dailyLossLimit && dailyLossLimit > 0) {
    warnings.push("Daily loss limit is reached.");
  }

  if (settings.maxWeeklyLossPercent > 0 && weeklyLossUsed >= weeklyLossLimit && weeklyLossLimit > 0) {
    warnings.push("Weekly loss limit is reached.");
  }

  return warnings;
}

function startOfWeekTimestamp(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year || 1970, (month || 1) - 1, day || 1);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date.getTime();
}

function FormHeader({ title }: { title: string }) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Trade Journal
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
    </section>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">{children}</div>
    </section>
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

function ReadOnlyMetric({ label, suffix = "", value }: { label: string; suffix?: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{formatNumber(value)}{suffix}</p>
    </div>
  );
}

function ScreenshotField({
  label,
  onDelete,
  onUpload,
  url,
}: {
  label: string;
  onDelete: () => void;
  onUpload: (file: File | null) => void;
  url?: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-3 grid min-h-48 place-items-center overflow-hidden rounded-md border bg-muted/30">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={label} className="max-h-64 w-full object-contain" src={url} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <ImagePlus aria-hidden="true" className="size-8" />
            No image uploaded
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
          <Upload aria-hidden="true" className="size-4" />
          {url ? "Replace" : "Upload"}
          <input
            accept="image/*"
            className="sr-only"
            onChange={(event) => onUpload(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
        <Button disabled={!url} onClick={onDelete} type="button" variant="ghost">
          <Trash2 aria-hidden="true" className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function isValidNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
