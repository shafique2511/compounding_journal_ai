"use client";

import { Download, Monitor, Moon, RotateCcw, Save, Sun, Trash2, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import type React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { calculateCumulativeProfit, calculateLossRate, calculateMaxDrawdown, calculateWinRate } from "@/lib/calculations";
import { getFriendlyErrorMessage, logTechnicalError } from "@/lib/errors/app-error";
import { deleteUserDocuments, saveFilterPreset, saveStrategy, saveUserSettings } from "@/lib/supabase";
import { settingsSchema } from "@/lib/validation";
import { formatTimezoneOffset, getBrowserTimezoneOffsetMinutes } from "@/lib/time/local-time";
import { recalculateTradesInSequence } from "@/lib/trades/trade-ledger";
import { deleteAllTrades as deleteAllRemoteTrades, recalculateTradesAfterChange } from "@/src/services/tradeService";
import { symbolPresets } from "@/src/data/symbolPresets";
import { DEFAULT_SETTINGS } from "@/store";
import { useJournalStore } from "@/store";
import type { AppSettings, FilterPreset, Strategy, Trade, Withdrawal } from "@/types";
import { cn } from "@/lib/utils";

const currencies = ["USD", "MYR", "EUR", "GBP", "JPY", "AUD", "Custom"];
const dateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;
const timeFormats = ["12-hour", "24-hour"] as const;
const timeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"];
const themeOptions = [
  { value: "light" as const, label: "Light mode", icon: Sun },
  { value: "dark" as const, label: "Dark mode", icon: Moon },
  { value: "system" as const, label: "System default", icon: Monitor },
];
const aiProviderOptions = [
  { value: "gemini" as const, label: "Gemini" },
  { value: "openai" as const, label: "ChatGPT / OpenAI" },
];
const defaultAiModels = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4.1-mini",
} satisfies Record<AppSettings["aiProvider"], string>;

type BackupPayload = {
  filterPresets?: FilterPreset[];
  settings?: AppSettings;
  strategies?: Strategy[];
  trades?: Trade[];
  withdrawals?: Withdrawal[];
};

export function SettingsPanel() {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    filterPresets,
    setFilterPresets,
    setSettings,
    setStrategies,
    setTrades,
    setWithdrawals,
    settings,
    strategies,
    trades,
    withdrawals,
  } = useJournalStore();
  const [draft, setDraft] = useState<AppSettings>(() => ({ ...DEFAULT_SETTINGS, ...settings }));
  const [currencyMode, setCurrencyMode] = useState(currencies.includes(draft.currency) ? draft.currency : "Custom");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [message, setMessage] = useState("");

  async function handleSave() {
    const parsedSettings = settingsSchema.safeParse(draft);

    if (!parsedSettings.success) {
      setMessage(parsedSettings.error.issues[0]?.message ?? "Settings are invalid.");
      return;
    }

    const nextSettings = parsedSettings.data;
    const recalculatedTrades =
      nextSettings.initialBalance !== settings.initialBalance
        ? recalculateTradesInSequence(trades, nextSettings.initialBalance)
        : trades;

    setSettings(nextSettings);
    setTrades(recalculatedTrades);
    setTheme(nextSettings.themeMode);
    setMessage("Settings saved.");

    if (user) {
      await saveUserSettings(user.id, nextSettings).catch((caughtError) => {
        logTechnicalError(caughtError, { action: "save settings", source: "database" });
        setMessage(getFriendlyErrorMessage(caughtError, "Settings saved locally. Supabase could not sync settings."));
      });
      if (recalculatedTrades !== trades) {
        await recalculateTradesAfterChange(user.id, recalculatedTrades, nextSettings.initialBalance).catch((caughtError) => {
          logTechnicalError(caughtError, { action: "sync recalculated trades", source: "database" });
          setMessage(getFriendlyErrorMessage(caughtError, "Settings saved locally. Supabase could not sync recalculated trades."));
        });
      }
    }
  }

  function handleCurrencyChange(value: string) {
    setCurrencyMode(value);
    if (value !== "Custom") {
      setDraft((current) => ({ ...current, currency: value }));
    }
  }

  function handleUseBrowserOffset() {
    setDraft((current) => ({
      ...current,
      timezoneOffset: formatTimezoneOffset(getBrowserTimezoneOffsetMinutes()),
    }));
    setMessage("");
  }

  function exportTradesCsv() {
    runDataAction(() => downloadFile("trade-journal-trades.csv", toCsv(trades), "text/csv"), "Trades CSV exported.");
  }

  function exportDashboardCsv() {
    runDataAction(() => {
      const rows = [
        ["Metric", "Value"],
        ["Initial Balance", draft.initialBalance],
        ["Current Balance", trades.at(-1)?.endingBalance ?? draft.initialBalance],
        ["Total Net Profit", calculateCumulativeProfit(trades)],
        ["Total Withdrawals", trades.reduce((total, trade) => total + safe(trade.withdrawalAmount), 0)],
        ["Total Trades", trades.length],
        ["Win Rate", calculateWinRate(trades)],
        ["Loss Rate", calculateLossRate(trades)],
        ["Maximum Drawdown", calculateMaxDrawdown(trades)],
      ];
      downloadFile("trade-journal-dashboard-summary.csv", rows.map((row) => row.join(",")).join("\n"), "text/csv");
    }, "Dashboard summary CSV exported.");
  }

  function backupJson() {
    runDataAction(() => {
      downloadFile(
        "trade-compounding-journal-backup.json",
        JSON.stringify({ filterPresets, settings: draft, strategies, trades, withdrawals }, null, 2),
        "application/json",
      );
    }, "Backup JSON exported.");
  }

  function runDataAction(action: () => void, successMessage: string) {
    try {
      action();
      setMessage(successMessage);
    } catch (caughtError) {
      logTechnicalError(caughtError, { action: "data export", source: "export" });
      setMessage("Data action failed. Check browser download permissions and try again.");
    }
  }

  async function restoreJson(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const payload = JSON.parse(await file.text()) as BackupPayload;
      const restoredSettings = settingsSchema.parse({ ...DEFAULT_SETTINGS, ...payload.settings });
      const restoredTrades = recalculateTradesInSequence(payload.trades ?? [], restoredSettings.initialBalance);
      setSettings(restoredSettings);
      setDraft(restoredSettings);
      setTrades(restoredTrades);
      setStrategies(payload.strategies ?? []);
      setWithdrawals(payload.withdrawals ?? []);
      setFilterPresets(payload.filterPresets ?? []);

      if (user) {
        await Promise.all([
          deleteUserDocuments(user.id, "trades"),
          deleteUserDocuments(user.id, "strategies"),
          deleteUserDocuments(user.id, "filterPresets"),
        ]);
        await saveUserSettings(user.id, restoredSettings);
        await Promise.all([
          recalculateTradesAfterChange(user.id, restoredTrades, restoredSettings.initialBalance),
          ...(payload.strategies ?? []).map((strategy) => saveStrategy(user.id, strategy)),
          ...(payload.filterPresets ?? []).map((preset) => saveFilterPreset(user.id, preset)),
        ]);
      }

      setMessage("Backup restored. Balances were recalculated.");
    } catch (caughtError) {
      logTechnicalError(caughtError, { action: "restore settings backup", source: "backup" });
      setMessage(getFriendlyErrorMessage(caughtError, "Backup file is invalid."));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function deleteAllTrades() {
    if (deleteConfirm !== "DELETE") {
      setMessage("Type DELETE to confirm deleting all trades.");
      return;
    }

    setTrades([]);
    setDeleteConfirm("");

    if (!user) {
      setMessage("All trades deleted.");
      return;
    }

    try {
      await deleteAllRemoteTrades(user.id);
      setMessage("All trades deleted.");
    } catch (caughtError) {
        logTechnicalError(caughtError, { action: "delete all trades", source: "database" });
        setMessage(getFriendlyErrorMessage(caughtError, "All trades deleted locally. Supabase could not sync the change."));
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Settings</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Trading Journal Settings</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Configure account, local time handling, risk warnings, AI provider, appearance, and data tools.
        </p>
      </div>

      <SettingsSection title="1. Account Settings">
        <NumberInput label="Initial Balance" min={0} onChange={(value) => setDraft({ ...draft, initialBalance: value })} value={draft.initialBalance} />
        <Field label="Account Currency">
          <select className={inputClass} onChange={(event) => handleCurrencyChange(event.target.value)} value={currencyMode}>
            {currencies.map((currency) => <option key={currency}>{currency}</option>)}
          </select>
        </Field>
        {currencyMode === "Custom" ? (
          <Field label="Custom Currency">
            <input className={inputClass} maxLength={8} onChange={(event) => setDraft({ ...draft, currency: event.target.value.toUpperCase() })} value={draft.currency} />
          </Field>
        ) : null}
      </SettingsSection>

      <SettingsSection title="2. Time Settings">
        <Field label="Timezone offset">
          <div className="flex gap-2">
            <input className={inputClass} onChange={(event) => setDraft({ ...draft, timezoneOffset: event.target.value })} value={draft.timezoneOffset} />
            <Button onClick={handleUseBrowserOffset} type="button" variant="secondary">
              <RotateCcw aria-hidden="true" className="size-4" />
              Browser
            </Button>
          </div>
        </Field>
        <Field label="Date format">
          <select className={inputClass} onChange={(event) => setDraft({ ...draft, dateFormat: event.target.value as AppSettings["dateFormat"] })} value={draft.dateFormat}>
            {dateFormats.map((format) => <option key={format}>{format}</option>)}
          </select>
        </Field>
        <Field label="Time format">
          <select className={inputClass} onChange={(event) => setDraft({ ...draft, timeFormat: event.target.value as AppSettings["timeFormat"] })} value={draft.timeFormat}>
            {timeFormats.map((format) => <option key={format}>{format}</option>)}
          </select>
        </Field>
      </SettingsSection>

      <SettingsSection title="3. Journal Settings">
        <Toggle checked={draft.autoTradeNumber} label="Auto trade number" onChange={(value) => setDraft({ ...draft, autoTradeNumber: value })} />
        <Field label="Default timeframe">
          <select className={inputClass} onChange={(event) => setDraft({ ...draft, defaultTimeframe: event.target.value })} value={draft.defaultTimeframe}>
            {timeframes.map((timeframe) => <option key={timeframe}>{timeframe}</option>)}
          </select>
        </Field>
        <Field label="Default symbol">
          <div className="grid gap-2">
            <input
              className={inputClass}
              list="settings-symbol-presets"
              onChange={(event) => setDraft({ ...draft, defaultSymbol: event.target.value.toUpperCase() })}
              value={draft.defaultSymbol}
            />
            <datalist id="settings-symbol-presets">
              {symbolPresets.map((symbol) => <option key={symbol} value={symbol} />)}
            </datalist>
            <select
              className={inputClass}
              onChange={(event) => setDraft({ ...draft, defaultSymbol: event.target.value })}
              value={symbolPresets.includes(draft.defaultSymbol) ? draft.defaultSymbol : ""}
            >
              <option value="">Symbol preset</option>
              {symbolPresets.map((symbol) => <option key={symbol}>{symbol}</option>)}
            </select>
          </div>
        </Field>
        <NumberInput label="Default commission" onChange={(value) => setDraft({ ...draft, defaultCommission: value })} value={draft.defaultCommission} />
        <NumberInput label="Default swap" onChange={(value) => setDraft({ ...draft, defaultSwap: value })} value={draft.defaultSwap} />
      </SettingsSection>

      <SettingsSection title="4. Risk Management Rules">
        <NumberInput label="Maximum risk per trade %" min={0} onChange={(value) => setDraft({ ...draft, maxRiskPerTradePercent: value })} value={draft.maxRiskPerTradePercent} />
        <NumberInput label="Maximum daily loss %" min={0} onChange={(value) => setDraft({ ...draft, maxDailyLossPercent: value })} value={draft.maxDailyLossPercent} />
        <NumberInput label="Maximum weekly loss %" min={0} onChange={(value) => setDraft({ ...draft, maxWeeklyLossPercent: value })} value={draft.maxWeeklyLossPercent} />
        <NumberInput label="Maximum trades per day" min={0} onChange={(value) => setDraft({ ...draft, maxTradesPerDay: value })} value={draft.maxTradesPerDay} />
        <NumberInput label="Maximum losing streak warning" min={0} onChange={(value) => setDraft({ ...draft, maxLosingStreakWarning: value })} value={draft.maxLosingStreakWarning} />
        <NumberInput label="Minimum risk reward ratio" min={0} onChange={(value) => setDraft({ ...draft, minimumRiskRewardRatio: value })} value={draft.minimumRiskRewardRatio} />
        <Toggle checked={draft.enableRiskWarning} label="Enable risk warning" onChange={(value) => setDraft({ ...draft, enableRiskWarning: value })} />
      </SettingsSection>

      <SettingsSection title="5. AI Settings">
        <Field label="AI provider">
          <select
            className={inputClass}
            onChange={(event) => {
              const aiProvider = event.target.value as AppSettings["aiProvider"];
              const currentModelMatchesProvider =
                aiProvider === "gemini"
                  ? draft.aiModel.startsWith("gemini-")
                  : draft.aiModel && !draft.aiModel.startsWith("gemini-");
              setDraft({
                ...draft,
                aiModel: currentModelMatchesProvider ? draft.aiModel : defaultAiModels[aiProvider],
                aiProvider,
              });
            }}
            value={draft.aiProvider}
          >
            {aiProviderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <Field label="AI model">
          <input
            className={inputClass}
            onChange={(event) => setDraft({ ...draft, aiModel: event.target.value })}
            placeholder={defaultAiModels[draft.aiProvider]}
            value={draft.aiModel}
          />
        </Field>
        <Toggle checked={draft.enableScreenshotAnalysis} label="Enable screenshot analysis" onChange={(value) => setDraft({ ...draft, enableScreenshotAnalysis: value })} />
        <Toggle checked={draft.saveAiAnalysisHistory} label="Save AI analysis history" onChange={(value) => setDraft({ ...draft, saveAiAnalysisHistory: value })} />
      </SettingsSection>

      <details className="rounded-lg border bg-card p-5 shadow-sm md:p-6" open>
        <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight">6. Appearance</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 min-[430px]:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = draft.themeMode === option.value;
              return (
                <button
                  className={cn("flex h-11 items-center justify-center gap-2 rounded-md border text-sm transition-colors md:h-10", isSelected ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent")}
                  key={option.value}
                  onClick={() => {
                    setDraft({ ...draft, themeMode: option.value });
                    setTheme(option.value);
                  }}
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
          <Field label="Accent color">
            <input className={inputClass} onChange={(event) => setDraft({ ...draft, accentColor: event.target.value })} type="color" value={draft.accentColor} />
          </Field>
        </div>
      </details>

      <details className="rounded-lg border bg-card p-5 shadow-sm md:p-6" open>
        <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight">7. Data</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button className="h-11 w-full justify-start" onClick={exportTradesCsv} type="button" variant="secondary"><Download className="size-4" />Export to CSV</Button>
          <Button className="h-11 w-full justify-start" onClick={exportDashboardCsv} type="button" variant="secondary"><Download className="size-4" />Export Dashboard CSV</Button>
          <Button className="h-11 w-full justify-start" onClick={backupJson} type="button" variant="secondary"><Download className="size-4" />Backup JSON</Button>
          <Button className="h-11 w-full justify-start" onClick={() => fileInputRef.current?.click()} type="button" variant="secondary"><Upload className="size-4" />Restore JSON</Button>
          <input ref={fileInputRef} className="hidden" accept="application/json" onChange={(event) => void restoreJson(event.target.files?.[0] ?? null)} type="file" />
        </div>
        <div className="mt-5 rounded-lg border border-loss/30 bg-loss/5 p-4">
          <p className="text-sm font-medium">Delete all trades with confirmation</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input className={inputClass} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder="Type DELETE" value={deleteConfirm} />
            <Button className="h-11 w-full sm:w-auto" onClick={deleteAllTrades} type="button"><Trash2 className="size-4" />Delete All Trades</Button>
          </div>
        </div>
      </details>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
        <Button className="h-11 w-full sm:w-auto" onClick={() => void handleSave()} type="button">
          <Save aria-hidden="true" className="size-4" />
          Save Settings
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </section>
  );
}

const inputClass = "h-11 w-full rounded-md border bg-background px-3 text-base outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm";

function SettingsSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <details className="rounded-lg border bg-card p-5 shadow-sm md:p-6" open>
      <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight">{title}</summary>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </details>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="space-y-2"><span className="text-sm font-medium">{label}</span>{children}</label>;
}

function NumberInput({ label, min, onChange, value }: { label: string; min?: number; onChange: (value: number) => void; value: number }) {
  return (
    <Field label={label}>
      <input
        className={inputClass}
        min={min}
        onFocus={(event) => {
          if (event.currentTarget.value === "0") {
            event.currentTarget.select();
          }
        }}
        onChange={(event) => onChange(parseNumberInput(event.target.value, min))}
        step="any"
        type="number"
        value={Number.isFinite(value) ? value : 0}
      />
    </Field>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm font-medium md:min-h-10">
      {label}
      <input checked={checked} className="size-4" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}

function toCsv(trades: Trade[]) {
  const headers = ["Trade Number", "Date", "Time", "Symbol", "Direction", "Timeframe", "Status", "Net Profit/Loss", "Withdrawal", "Ending Balance", "Rule Followed", "Quality Score", "Quality Grade"];
  const rows = trades.map((trade) => [
    trade.tradeNumber,
    trade.date,
    trade.time,
    trade.symbol,
    trade.direction,
    trade.timeframe,
    trade.status,
    trade.netProfitLoss,
    trade.withdrawalAmount,
    trade.endingBalance,
    trade.ruleFollowed,
    trade.tradeQualityScore,
    trade.tradeQualityGrade,
  ]);

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function downloadFile(fileName: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function safe(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseNumberInput(value: string, min?: number) {
  const parsedValue = value.trim() === "" ? 0 : Number(value);
  const safeValue = Number.isFinite(parsedValue) ? parsedValue : 0;
  return typeof min === "number" ? Math.max(min, safeValue) : safeValue;
}
