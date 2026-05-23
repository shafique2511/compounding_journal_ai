"use client";

import { BrainCircuit, Loader2, Save, Sparkles } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { useEscapeToClose } from "@/hooks/use-escape-to-close";
import { getFriendlyErrorMessage, logTechnicalError } from "@/lib/errors/app-error";
import {
  buildAiInputSummary,
  filterTradesForAi,
  type AiAnalysisFilter,
  type AiFilterValues,
} from "@/lib/ai/analysis";
import { saveAiAnalysis } from "@/lib/supabase";
import { getCurrentTimestamp } from "@/lib/time/timestamp";
import { useJournalStore } from "@/store";
import type { AiAnalysis, AiProvider } from "@/types";

const filters: { label: string; value: AiAnalysisFilter }[] = [
  { label: "Analyze all trades", value: "all" },
  { label: "Analyze this week", value: "week" },
  { label: "Analyze this month", value: "month" },
  { label: "Analyze custom date range", value: "custom" },
  { label: "Analyze selected trade only", value: "trade" },
  { label: "Analyze selected strategy", value: "strategy" },
  { label: "Analyze selected symbol", value: "symbol" },
  { label: "Analyze losing trades only", value: "losing" },
  { label: "Analyze rule broken trades only", value: "rule-broken" },
  { label: "Analyze low quality trades only", value: "low-quality" },
];

type AiResponse = {
  analysis?: string;
  error?: string;
  inputSummary?: Record<string, unknown>;
  model?: string;
  provider?: AiProvider;
};

const defaultFilterValues: AiFilterValues = {
  customFrom: "",
  customTo: "",
  filter: "all",
  selectedStrategy: "",
  selectedSymbol: "",
  selectedTradeId: "",
};

export function AiAnalysisPage() {
  const { user } = useAuth();
  const { settings, strategies, trades } = useJournalStore();
  const [filterValues, setFilterValues] = useState<AiFilterValues>(defaultFilterValues);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSummary, setLastSummary] = useState<Record<string, unknown> | null>(null);

  const symbols = unique(trades.map((trade) => trade.symbol));
  const strategyNames = unique(trades.map((trade) => trade.strategyName).filter(Boolean));
  const selectedTrades = useMemo(
    () => filterTradesForAi(trades, filterValues),
    [filterValues, trades],
  );
  const providerLabel = settings.aiProvider === "openai" ? "ChatGPT / OpenAI" : "Gemini";
  const ProviderIcon = settings.aiProvider === "openai" ? BrainCircuit : Sparkles;
  const analysisSections = useMemo(() => splitAiSections(analysis), [analysis]);
  useEscapeToClose(showMobileFilters, () => setShowMobileFilters(false));

  async function runAnalysis() {
    setError("");
    setMessage("");

    if (settings.aiProvider !== "openai" && settings.aiProvider !== "gemini") {
      setError("Select Gemini or ChatGPT / OpenAI in Settings before running AI analysis.");
      return;
    }

    if (selectedTrades.length === 0) {
      setError("No trades match the selected AI filter.");
      return;
    }

    if (requiresSelection(filterValues)) {
      setError("Select the required trade, strategy, or symbol before running AI analysis.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/ai/analyze", {
        body: JSON.stringify({
          filters: filterValues,
          model: settings.aiModel,
          provider: settings.aiProvider,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json()) as AiResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error || "AI analysis failed.");
      }

      const result = data.analysis?.trim() || "AI returned an empty analysis.";
      const summary =
        data.inputSummary ?? buildAiInputSummary(selectedTrades, strategies, settings, filterValues);
      setAnalysis(result);
      setLastSummary(summary);
      setMessage(settings.saveAiAnalysisHistory ? "Analysis complete. History saved." : "Analysis complete.");
    } catch (caughtError) {
      logTechnicalError(caughtError, { action: "run AI analysis", source: "ai" });
      setError(getFriendlyErrorMessage(caughtError, "AI analysis failed. Check your provider settings and try again."));
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function saveCurrentAnalysis() {
    setMessage("");

    if (!analysis || !lastSummary) {
      setError("Run an analysis before saving it.");
      return;
    }

    if (!user) {
      setError("Login is required to save AI analysis history.");
      return;
    }

    try {
      await saveAiAnalysis(user.id, {
        id: crypto.randomUUID(),
        provider: settings.aiProvider,
        model: settings.aiModel,
        analysisType: filterValues.filter,
        dateRange: formatDateRange(filterValues),
        inputSummary: lastSummary,
        result: analysis,
        createdAt: getCurrentTimestamp(),
      } satisfies AiAnalysis);
      setError("");
      setMessage("AI analysis saved.");
    } catch {
      logTechnicalError("AI history save failed.", { action: "save AI analysis", source: "database" });
      setError("AI analysis could not be saved. Check Supabase permissions and try again.");
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              AI Analysis
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Trading Journal Coach</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Analyze trade performance, compounding progress, psychology, screenshots, discipline,
              strategies, curves, reviews, and next focus areas using the provider selected in Settings.
            </p>
          </div>
          <div className="w-full rounded-lg border bg-background p-4 md:w-auto">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ProviderIcon aria-hidden="true" className="size-4 text-analytics" />
              {providerLabel}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{settings.aiModel || "Default server model"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_1fr]">
        <section className="space-y-5">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-tight">AI Filters</h3>
              <Button className="md:hidden" onClick={() => setShowMobileFilters(true)} type="button" variant="secondary">Open</Button>
            </div>
            <div className="mt-3 rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground md:hidden">
              {filters.find((filter) => filter.value === filterValues.filter)?.label ?? "Analyze all trades"}
            </div>
            <div className="mt-4 hidden md:block">
              <AiFilterControls
                filterValues={filterValues}
                setFilterValues={setFilterValues}
                strategies={strategyNames}
                symbols={symbols}
                trades={trades}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight">Selected Data</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Trades" value={selectedTrades.length} />
              <MiniMetric label="Screenshots" value={selectedTrades.filter((trade) => trade.beforeScreenshotUrl || trade.afterScreenshotUrl).length} />
              <MiniMetric label="Rule Broken" value={selectedTrades.filter((trade) => trade.ruleFollowed === "No").length} />
              <MiniMetric label="Low Quality" value={selectedTrades.filter((trade) => trade.tradeQualityScore < 70).length} />
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Button className="h-11 w-full" disabled={isAnalyzing} onClick={() => void runAnalysis()} type="button">
                {isAnalyzing ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <BrainCircuit aria-hidden="true" className="size-4" />}
                Run AI Analysis
              </Button>
              <Button className="h-11 w-full" disabled={!analysis} onClick={() => void saveCurrentAnalysis()} type="button" variant="secondary">
                <Save aria-hidden="true" className="size-4" />
                Save Analysis
              </Button>
            </div>

            {error ? <p className="mt-4 text-sm text-loss">{error}</p> : null}
            {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
          </div>

          <SafetyPanel />
        </section>

        <section className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
          <h3 className="text-lg font-semibold tracking-tight">AI Output</h3>
          <div className="mt-4 min-h-[420px] rounded-lg border bg-background p-4 md:min-h-[520px] md:p-5">
            {isAnalyzing ? (
              <div className="flex h-full min-h-[460px] items-center justify-center text-sm text-muted-foreground">
                <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
                Analyzing selected journal data...
              </div>
            ) : analysis ? (
              <div className="grid gap-3">
                {analysisSections.length > 0 ? analysisSections.map((section, index) => (
                  <details className="rounded-lg border bg-card p-4" key={`${section.title}-${index}`} open={index < 2}>
                    <summary className="cursor-pointer list-none font-semibold tracking-tight">{section.title}</summary>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{section.body}</div>
                  </details>
                )) : (
                  <div className="whitespace-pre-wrap text-sm leading-6 text-foreground">{analysis}</div>
                )}
              </div>
            ) : (
              <div className="grid min-h-[460px] place-items-center text-center text-sm text-muted-foreground">
                Run an analysis to generate coaching feedback across performance, risk, psychology,
                screenshots, strategy, compounding, and review quality.
              </div>
            )}
          </div>
        </section>
      </div>

      {showMobileFilters ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm md:hidden">
          <button aria-label="Close AI filters" className="fixed inset-0" onClick={() => setShowMobileFilters(false)} type="button" />
          <div className="relative mx-auto max-h-[calc(100vh-2rem)] max-w-md overflow-y-auto rounded-lg border bg-card p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">AI Analysis Filters</h3>
              <Button onClick={() => setShowMobileFilters(false)} type="button" variant="secondary">Done</Button>
            </div>
            <AiFilterControls
              filterValues={filterValues}
              setFilterValues={setFilterValues}
              strategies={strategyNames}
              symbols={symbols}
              trades={trades}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AiFilterControls({
  filterValues,
  setFilterValues,
  strategies,
  symbols,
  trades,
}: {
  filterValues: AiFilterValues;
  setFilterValues: React.Dispatch<React.SetStateAction<AiFilterValues>>;
  strategies: string[];
  symbols: string[];
  trades: { date: string; id: string; symbol: string; tradeNumber: number }[];
}) {
  return (
    <div className="grid gap-3">
      <Field label="Analysis scope">
        <Select
          onChange={(value) =>
            setFilterValues((current) => ({ ...current, filter: value as AiAnalysisFilter }))
          }
          value={filterValues.filter}
        >
          {filters.map((filter) => (
            <option key={filter.value} value={filter.value}>{filter.label}</option>
          ))}
        </Select>
      </Field>

      {filterValues.filter === "custom" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From">
            <Input onChange={(value) => setFilterValues((current) => ({ ...current, customFrom: value }))} type="date" value={filterValues.customFrom} />
          </Field>
          <Field label="To">
            <Input onChange={(value) => setFilterValues((current) => ({ ...current, customTo: value }))} type="date" value={filterValues.customTo} />
          </Field>
        </div>
      ) : null}

      {filterValues.filter === "trade" ? (
        <Field label="Selected trade">
          <Select onChange={(value) => setFilterValues((current) => ({ ...current, selectedTradeId: value }))} value={filterValues.selectedTradeId}>
            <option value="">Select trade</option>
            {trades.map((trade) => (
              <option key={trade.id} value={trade.id}>#{trade.tradeNumber} {trade.symbol} {trade.date}</option>
            ))}
          </Select>
        </Field>
      ) : null}

      {filterValues.filter === "strategy" ? (
        <Field label="Selected strategy">
          <Select onChange={(value) => setFilterValues((current) => ({ ...current, selectedStrategy: value }))} value={filterValues.selectedStrategy}>
            <option value="">Select strategy</option>
            {strategies.map((strategy) => <option key={strategy}>{strategy}</option>)}
          </Select>
        </Field>
      ) : null}

      {filterValues.filter === "symbol" ? (
        <Field label="Selected symbol">
          <Select onChange={(value) => setFilterValues((current) => ({ ...current, selectedSymbol: value }))} value={filterValues.selectedSymbol}>
            <option value="">Select symbol</option>
            {symbols.map((symbol) => <option key={symbol}>{symbol}</option>)}
          </Select>
        </Field>
      ) : null}
    </div>
  );
}

function SafetyPanel() {
  const rules = [
    "Trading journal coaching only",
    "No trade signals",
    "No profit guarantees",
    "No revenge trading encouragement",
    "No overlotting encouragement",
    "No unsafe risk advice",
  ];

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight">AI Guardrails</h3>
      <div className="mt-4 grid gap-2">
        {rules.map((rule) => (
          <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground" key={rule}>
            {rule}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function Input({
  onChange,
  type = "text",
  value,
}: {
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <input
      className="h-11 w-full rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm"
      onChange={(event) => onChange(event.target.value)}
      type={type}
      value={value}
    />
  );
}

function Select({
  children,
  onChange,
  value,
}: {
  children: React.ReactNode;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <select
      className="h-11 w-full rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {children}
    </select>
  );
}

function requiresSelection(values: AiFilterValues) {
  return (
    (values.filter === "trade" && !values.selectedTradeId) ||
    (values.filter === "strategy" && !values.selectedStrategy) ||
    (values.filter === "symbol" && !values.selectedSymbol)
  );
}

function formatDateRange(values: AiFilterValues) {
  if (values.filter === "custom") {
    return `${values.customFrom || "start"} to ${values.customTo || "end"}`;
  }

  return filters.find((filter) => filter.value === values.filter)?.label ?? values.filter;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function splitAiSections(analysis: string) {
  if (!analysis.trim()) {
    return [];
  }

  const matches = Array.from(analysis.matchAll(/(?:^|\n)(\d+\.\s+[^\n]+)/g));

  if (matches.length === 0) {
    return [];
  }

  return matches.map((match, index) => {
    const start = (match.index ?? 0) + (match[0].startsWith("\n") ? 1 : 0);
    const bodyStart = start + match[1].length;
    const end = matches[index + 1]?.index ?? analysis.length;

    return {
      title: match[1].trim(),
      body: analysis.slice(bodyStart, end).trim(),
    };
  });
}
