"use client";

import Link from "next/link";
import { BookOpen, Check, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { useEscapeToClose } from "@/hooks/use-escape-to-close";
import { getFriendlyErrorMessage, logTechnicalError } from "@/lib/errors/app-error";
import { saveStrategy } from "@/lib/supabase";
import { getCurrentTimestamp } from "@/lib/time/timestamp";
import {
  strategyTemplateFilterChips,
  strategyTemplates,
  type StrategyTemplate,
} from "@/src/data/strategyTemplates";
import { useJournalStore } from "@/store";
import type { Strategy } from "@/types";
import { cn } from "@/lib/utils";

type StrategyTemplateLibraryProps = {
  compact?: boolean;
  onMessage?: (message: string) => void;
  onUseStrategy?: (strategy: Strategy) => void;
};

const markets = ["Forex", "Gold", "Crypto", "Indices", "All"];
const timeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];
const styles = [
  "Trend following",
  "Pullback",
  "Breakout",
  "Reversal",
  "Support and resistance",
  "Fibonacci",
  "RSI",
  "Scalping",
  "Swing trading",
  "Risk-first discipline",
];
const levels = ["Beginner", "Intermediate", "Advanced"];

export function StrategyTemplateLibrary({
  compact = false,
  onMessage,
  onUseStrategy,
}: StrategyTemplateLibraryProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { strategies, upsertStrategy } = useJournalStore();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null);
  const [helperAnswers, setHelperAnswers] = useState({
    market: "Forex",
    timeframe: "M15",
    style: "Trend following",
    level: "Beginner",
  });
  const filteredTemplates = useMemo(
    () =>
      strategyTemplates.filter(
        (template) =>
          matchesFilter(template, activeFilter) &&
          matchesSearch(template, search),
      ),
    [activeFilter, search],
  );
  const suggestions = useMemo(
    () => recommendTemplates(helperAnswers),
    [helperAnswers],
  );
  useEscapeToClose(Boolean(selectedTemplate), () => setSelectedTemplate(null));

  async function addTemplateToPlaybook(template: StrategyTemplate) {
    const existing = strategies.find(
      (strategy) => normalize(strategy.strategyName) === normalize(template.strategyName),
    );

    if (existing) {
      onMessage?.(`${existing.strategyName} is already in My Strategy Playbook.`);
      return existing;
    }

    const now = getCurrentTimestamp();
    const nextStrategy = templateToStrategy(template, now);
    upsertStrategy(nextStrategy);

    if (user) {
      try {
        await saveStrategy(user.id, nextStrategy);
      } catch (caughtError) {
        logTechnicalError(caughtError, { action: "copy strategy template", source: "database" });
        onMessage?.(getFriendlyErrorMessage(caughtError, "Template copied locally. Supabase could not sync it."));
        return nextStrategy;
      }
    }

    onMessage?.(`${nextStrategy.strategyName} added to My Strategy Playbook.`);
    return nextStrategy;
  }

  async function handleUseTemplate(template: StrategyTemplate) {
    const strategy = await addTemplateToPlaybook(template);
    onUseStrategy?.(strategy);
    setSelectedTemplate(null);
  }

  async function handleUseInAddTrade(template: StrategyTemplate) {
    const strategy = await addTemplateToPlaybook(template);
    router.push(`/journal/add?strategy=${encodeURIComponent(strategy.strategyName)}`);
  }

  return (
    <section className={cn("rounded-lg border bg-card p-5 shadow-sm", compact && "p-4")}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Strategy Template Library
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">Built-in educational templates</h3>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Browse ready-made strategy structures, copy one into your playbook, then edit it to match your own rules.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/strategies/add">
            <BookOpen aria-hidden="true" className="size-4" />
            Add New Strategy
          </Link>
        </Button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
        <label className="relative block">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search templates"
            value={search}
          />
        </label>
        <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
          {filteredTemplates.length} templates available
        </div>
      </div>

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2 md:flex-wrap md:overflow-visible">
        {strategyTemplateFilterChips.map((chip) => (
          <button
            className={cn(
              "shrink-0 rounded-full border px-3 py-2 text-sm transition md:py-1.5",
              activeFilter === chip
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground",
            )}
            key={chip}
            onClick={() => setActiveFilter(chip)}
            type="button"
          >
            {chip}
          </button>
        ))}
      </div>

      <SuggestionHelper
        answers={helperAnswers}
        onAnswersChange={setHelperAnswers}
        onSelectTemplate={setSelectedTemplate}
        suggestions={suggestions}
      />

      <div className={cn("mt-5 grid gap-4", compact ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3")}>
        {filteredTemplates.map((template) => (
          <TemplateCard
            alreadyAdded={strategies.some((strategy) => normalize(strategy.strategyName) === normalize(template.strategyName))}
            key={template.id}
            onAdd={() => void addTemplateToPlaybook(template)}
            onView={() => setSelectedTemplate(template)}
            template={template}
          />
        ))}
      </div>

      {selectedTemplate ? (
        <TemplateDetailModal
          onAdd={() => void addTemplateToPlaybook(selectedTemplate)}
          onClose={() => setSelectedTemplate(null)}
          onEdit={() => router.push(`/strategies/add?template=${selectedTemplate.id}`)}
          onUse={() => void (onUseStrategy ? handleUseTemplate(selectedTemplate) : handleUseInAddTrade(selectedTemplate))}
          showUseInTrade={!onUseStrategy}
          template={selectedTemplate}
        />
      ) : null}
    </section>
  );
}

export function templateToStrategy(template: StrategyTemplate, timestamp = getCurrentTimestamp()): Strategy {
  return {
    id: crypto.randomUUID(),
    strategyName: template.strategyName,
    marketType: template.marketType,
    timeframe: template.timeframe,
    entryRules: template.entryRules,
    exitRules: template.exitRules,
    stopLossRules: template.stopLossRules,
    takeProfitRules: template.takeProfitRules,
    riskRules: template.riskRules,
    notes: buildTemplateNotes(template),
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function buildTemplateNotes(template: StrategyTemplate) {
  return [
    `Template Category: ${template.category}`,
    `Strategy Style: ${template.strategyStyle}`,
    `Difficulty: ${template.difficulty}`,
    "",
    "Checklist Focus:",
    ...template.checklistFocus.map((item) => `- ${item}`),
    "",
    "Common Mistakes:",
    ...template.commonMistakes.map((item) => `- ${item}`),
    "",
    template.notes,
  ].join("\n");
}

function TemplateCard({
  alreadyAdded,
  onAdd,
  onView,
  template,
}: {
  alreadyAdded: boolean;
  onAdd: () => void;
  onView: () => void;
  template: StrategyTemplate;
}) {
  return (
    <article className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold tracking-tight">{template.strategyName}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{template.strategyStyle}</p>
        </div>
        <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">{template.difficulty}</span>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
        <p><span className="text-foreground">Market:</span> {template.marketType}</p>
        <p><span className="text-foreground">Timeframe:</span> {template.timeframe}</p>
      </div>
      <div className="mt-4 grid gap-2 min-[375px]:grid-cols-2 md:flex md:flex-wrap">
        <Button className="h-11 w-full md:w-auto" onClick={onView} type="button" variant="secondary">View Template</Button>
        <Button className="h-11 w-full md:w-auto" onClick={onAdd} type="button" variant={alreadyAdded ? "ghost" : "default"}>
          {alreadyAdded ? <Check aria-hidden="true" className="size-4" /> : null}
          {alreadyAdded ? "In Playbook" : "Add to My Playbook"}
        </Button>
      </div>
    </article>
  );
}

function TemplateDetailModal({
  onAdd,
  onClose,
  onEdit,
  onUse,
  showUseInTrade,
  template,
}: {
  onAdd: () => void;
  onClose: () => void;
  onEdit: () => void;
  onUse: () => void;
  showUseInTrade: boolean;
  template: StrategyTemplate;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 p-0 backdrop-blur-sm md:grid md:place-items-center md:p-4">
      <button aria-label="Close strategy template detail" className="hidden md:fixed md:inset-0 md:block" onClick={onClose} type="button" />
      <div className="relative h-full w-full overflow-y-auto border bg-card p-4 shadow-lg md:max-h-[90vh] md:max-w-4xl md:rounded-lg md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{template.category}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">{template.strategyName}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {template.marketType} / {template.timeframe} / {template.difficulty}
            </p>
          </div>
          <Button onClick={onClose} type="button" variant="secondary">Cancel</Button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <RuleBlock label="Entry Rules" value={template.entryRules} />
          <RuleBlock label="Exit Rules" value={template.exitRules} />
          <RuleBlock label="Stop Loss Rules" value={template.stopLossRules} />
          <RuleBlock label="Take Profit Rules" value={template.takeProfitRules} />
          <RuleBlock label="Risk Rules" value={template.riskRules} />
          <RuleBlock label="Notes" value={template.notes} />
          <ListBlock label="Checklist Focus" values={template.checklistFocus} />
          <ListBlock label="Common Mistakes" values={template.commonMistakes} />
        </div>

        <div className="mt-5 grid gap-3 pb-4 md:flex md:flex-wrap md:justify-end md:pb-0">
          <Button className="h-11 w-full md:w-auto" onClick={onAdd} type="button" variant="secondary">Add to My Playbook</Button>
          <Button className="h-11 w-full md:w-auto" onClick={onEdit} type="button" variant="secondary">Edit Before Saving</Button>
          <Button className="h-11 w-full md:w-auto" onClick={onUse} type="button">{showUseInTrade ? "Use in Add Trade" : "Use This Template"}</Button>
        </div>
      </div>
    </div>
  );
}

function SuggestionHelper({
  answers,
  onAnswersChange,
  onSelectTemplate,
  suggestions,
}: {
  answers: { market: string; timeframe: string; style: string; level: string };
  onAnswersChange: (answers: { market: string; timeframe: string; style: string; level: string }) => void;
  onSelectTemplate: (template: StrategyTemplate) => void;
  suggestions: { reason: string; template: StrategyTemplate }[];
}) {
  return (
    <div className="mt-5 rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden="true" className="size-4 text-analytics" />
        <h4 className="font-semibold tracking-tight">Strategy Suggestion Helper</h4>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        This helper recommends educational templates only. It does not provide live trade advice.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <HelperSelect label="Market" onChange={(market) => onAnswersChange({ ...answers, market })} options={markets} value={answers.market} />
        <HelperSelect label="Timeframe" onChange={(timeframe) => onAnswersChange({ ...answers, timeframe })} options={timeframes} value={answers.timeframe} />
        <HelperSelect label="Style" onChange={(style) => onAnswersChange({ ...answers, style })} options={styles} value={answers.style} />
        <HelperSelect label="Experience" onChange={(level) => onAnswersChange({ ...answers, level })} options={levels} value={answers.level} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {suggestions.map(({ reason, template }) => (
          <button
            className="rounded-lg border bg-card p-3 text-left text-sm hover:border-primary"
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            type="button"
          >
            <span className="font-medium text-foreground">{template.strategyName}</span>
            <span className="mt-1 block text-muted-foreground">{reason}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HelperSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <select
        className="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function RuleBlock({ label, value }: { label: string; value: string }) {
  return (
    <details className="rounded-lg border bg-background p-4" open>
      <summary className="cursor-pointer list-none font-semibold tracking-tight">{label}</summary>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{value}</p>
    </details>
  );
}

function ListBlock({ label, values }: { label: string; values: string[] }) {
  return (
    <details className="rounded-lg border bg-background p-4" open>
      <summary className="cursor-pointer list-none font-semibold tracking-tight">{label}</summary>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {values.map((value) => <li key={value}>{value}</li>)}
      </ul>
    </details>
  );
}

function recommendTemplates(answers: { market: string; timeframe: string; style: string; level: string }) {
  return [...strategyTemplates]
    .map((template) => {
      let score = 0;
      const haystack = normalize(`${template.strategyName} ${template.category} ${template.strategyStyle} ${template.marketType} ${template.timeframe}`);

      if (answers.market === "All" || haystack.includes(normalize(answers.market)) || template.marketType === "All markets") score += 3;
      if (haystack.includes(normalize(answers.timeframe)) || template.timeframe === "All timeframes") score += 3;
      if (haystack.includes(normalize(answers.style))) score += 3;
      if (template.difficulty === answers.level) score += 2;

      return {
        score,
        template,
        reason: buildRecommendationReason(template, answers),
      };
    })
    .sort((first, second) => second.score - first.score)
    .slice(0, 3)
    .map(({ reason, template }) => ({ reason, template }));
}

function buildRecommendationReason(template: StrategyTemplate, answers: { market: string; timeframe: string; style: string; level: string }) {
  const reasons = [
    template.marketType.includes(answers.market) || template.marketType === "All markets" ? `${answers.market} fit` : "",
    template.timeframe.includes(answers.timeframe) || template.timeframe === "All timeframes" ? `${answers.timeframe} fit` : "",
    template.difficulty === answers.level ? `${answers.level} level` : "",
  ].filter(Boolean);

  return reasons.length ? reasons.join(" / ") : `Closest match for ${answers.style.toLowerCase()} journaling.`;
}

function matchesFilter(template: StrategyTemplate, filter: string) {
  if (filter === "All") return true;
  if (["Beginner", "Intermediate", "Advanced"].includes(filter)) return template.difficulty === filter;
  if (filter === "XAUUSD suitable") return template.marketType.includes("Gold");
  if (filter === "Forex suitable") return template.marketType.includes("Forex");
  if (filter === "Crypto suitable") return template.marketType.includes("Crypto");
  if (filter === "Intraday") return ["M5", "M15", "M30", "H1"].some((timeframe) => template.timeframe.includes(timeframe));
  if (filter === "Swing") return template.strategyStyle.includes("Swing") || ["H4", "D1"].some((timeframe) => template.timeframe.includes(timeframe));
  return normalize(`${template.category} ${template.strategyStyle} ${template.timeframe}`).includes(normalize(filter));
}

function matchesSearch(template: StrategyTemplate, search: string) {
  if (!search.trim()) return true;
  return normalize(`${template.strategyName} ${template.category} ${template.marketType} ${template.strategyStyle}`).includes(normalize(search));
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
