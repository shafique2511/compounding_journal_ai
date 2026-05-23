"use client";

import Link from "next/link";
import { Filter, Save, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { deleteUserDocument, listUserDocuments, saveFilterPreset } from "@/lib/supabase";
import { filterTradesByPreset } from "@/lib/filters/filter-presets";
import { getCurrentTimestamp } from "@/lib/time/timestamp";
import { useJournalStore } from "@/store";
import type { FilterPreset } from "@/types";

const dateFilters = [
  ["", "All dates"],
  ["today", "Today"],
  ["this-week", "This week"],
  ["this-month", "This month"],
  ["this-year", "This year"],
];
const timeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"];
const statuses = ["Win", "Loss", "Breakeven", "Running", "Cancelled"];
const qualityGrades = ["A+", "A", "B", "C", "D"];
const ruleStatuses = ["Yes", "No", "Partially"];

const emptyForm = {
  dateFilter: "",
  presetName: "",
  qualityGradeFilter: "",
  ruleFollowedFilter: "",
  statusFilter: "",
  strategyFilter: "",
  symbolFilter: "",
  timeframeFilter: "",
};

export function FilterPresetsPage() {
  const { user } = useAuth();
  const {
    filterPresets,
    removeFilterPreset,
    setFilterPresets,
    trades,
    upsertFilterPreset,
  } = useJournalStore();
  const [form, setForm] = useState(emptyForm);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    listUserDocuments<FilterPreset>(user.id, "filterPresets")
      .then(setFilterPresets)
      .catch(() => undefined);
  }, [setFilterPresets, user]);

  const selectedPreset = filterPresets.find((preset) => preset.id === selectedPresetId);
  const matchingTrades = useMemo(
    () => filterTradesByPreset(trades, selectedPreset),
    [selectedPreset, trades],
  );
  const symbols = unique(trades.map((trade) => trade.symbol));
  const strategies = unique(trades.map((trade) => trade.strategyName).filter(Boolean));

  async function savePreset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const presetName = form.presetName.trim();

    if (!presetName) {
      setMessage("Preset name is required.");
      return;
    }

    const now = getCurrentTimestamp();
    const preset: FilterPreset = {
      id: crypto.randomUUID(),
      presetName,
      dateFilter: form.dateFilter,
      symbolFilter: form.symbolFilter.trim().toUpperCase(),
      timeframeFilter: form.timeframeFilter,
      strategyFilter: form.strategyFilter,
      statusFilter: form.statusFilter,
      qualityGradeFilter: form.qualityGradeFilter,
      ruleFollowedFilter: form.ruleFollowedFilter,
      createdAt: now,
      updatedAt: now,
    };

    upsertFilterPreset(preset);
    setSelectedPresetId(preset.id);
    setForm(emptyForm);
    setMessage("Filter preset saved.");

    if (user) {
      try {
        await saveFilterPreset(user.id, preset);
      } catch {
        setMessage("Filter preset saved locally. Supabase is not available.");
      }
    }
  }

  async function deletePreset(preset: FilterPreset) {
    removeFilterPreset(preset.id);
    if (selectedPresetId === preset.id) {
      setSelectedPresetId("");
    }
    setMessage("Filter preset deleted.");

    if (user) {
      try {
        await deleteUserDocument(user.id, "filterPresets", preset.id);
      } catch {
        setMessage("Filter preset deleted locally. Supabase is not available.");
      }
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Advanced Filters
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Filter Presets</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Save reusable trade filters for journal review, dashboard reporting, and analytics.
        </p>
      </div>

      <form className="rounded-lg border bg-card p-5 shadow-sm" onSubmit={savePreset}>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <Field label="Preset name">
            <Input
              onChange={(value) => setForm({ ...form, presetName: value })}
              placeholder="XAUUSD only"
              value={form.presetName}
            />
          </Field>
          <Field label="Date filter">
            <Select
              onChange={(value) => setForm({ ...form, dateFilter: value })}
              value={form.dateFilter}
            >
              {dateFilters.map(([value, label]) => (
                <option key={label} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Symbol">
            <Input
              list="preset-symbols"
              onChange={(value) => setForm({ ...form, symbolFilter: value })}
              placeholder="XAUUSD"
              value={form.symbolFilter}
            />
            <datalist id="preset-symbols">
              {symbols.map((symbol) => <option key={symbol} value={symbol} />)}
            </datalist>
          </Field>
          <Field label="Timeframe">
            <Select
              onChange={(value) => setForm({ ...form, timeframeFilter: value })}
              value={form.timeframeFilter}
            >
              <option value="">Any timeframe</option>
              {timeframes.map((timeframe) => <option key={timeframe}>{timeframe}</option>)}
            </Select>
          </Field>
          <Field label="Strategy">
            <Select
              onChange={(value) => setForm({ ...form, strategyFilter: value })}
              value={form.strategyFilter}
            >
              <option value="">Any strategy</option>
              {strategies.map((strategy) => <option key={strategy}>{strategy}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              onChange={(value) => setForm({ ...form, statusFilter: value })}
              value={form.statusFilter}
            >
              <option value="">Any status</option>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </Select>
          </Field>
          <Field label="Quality grade">
            <Select
              onChange={(value) => setForm({ ...form, qualityGradeFilter: value })}
              value={form.qualityGradeFilter}
            >
              <option value="">Any grade</option>
              {qualityGrades.map((grade) => <option key={grade}>{grade}</option>)}
            </Select>
          </Field>
          <Field label="Rule followed">
            <Select
              onChange={(value) => setForm({ ...form, ruleFollowedFilter: value })}
              value={form.ruleFollowedFilter}
            >
              <option value="">Any rule status</option>
              {ruleStatuses.map((rule) => <option key={rule}>{rule}</option>)}
            </Select>
          </Field>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : <span />}
          <Button type="submit">
            <Save aria-hidden="true" className="size-4" />
            Save Preset
          </Button>
        </div>
      </form>

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Saved Presets</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Applying a preset here previews the matching trade count. Journal, Dashboard, and Analytics each include their own preset selector.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary"><Link href="/journal">Journal</Link></Button>
            <Button asChild variant="secondary"><Link href="/dashboard">Dashboard</Link></Button>
            <Button asChild variant="secondary"><Link href="/analytics">Analytics</Link></Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {filterPresets.map((preset) => (
            <div className="rounded-lg border bg-background p-4" key={preset.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h4 className="font-semibold">{preset.presetName}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatPresetSummary(preset)}
                  </p>
                  {selectedPresetId === preset.id ? (
                    <p className="mt-2 text-sm text-analytics">
                      {matchingTrades.length} matching trade{matchingTrades.length === 1 ? "" : "s"}.
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setSelectedPresetId(preset.id)} type="button" variant="secondary">
                    <Filter aria-hidden="true" className="size-4" />
                    Apply
                  </Button>
                  <button
                    aria-label={`Delete ${preset.presetName}`}
                    className="inline-flex size-9 items-center justify-center rounded-md border text-loss hover:bg-loss/10"
                    onClick={() => void deletePreset(preset)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filterPresets.length === 0 ? (
            <div className="rounded-lg border bg-background p-6 text-center text-sm text-muted-foreground">
              No filter presets saved yet.
            </div>
          ) : null}
        </div>
      </div>
    </section>
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
  list,
  onChange,
  placeholder,
  value,
}: {
  list?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <input
      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      list={list}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
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
      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {children}
    </select>
  );
}

function formatPresetSummary(preset: FilterPreset) {
  const parts = [
    labelValue("Date", dateLabel(preset.dateFilter)),
    labelValue("Symbol", preset.symbolFilter),
    labelValue("Timeframe", preset.timeframeFilter),
    labelValue("Strategy", preset.strategyFilter),
    labelValue("Status", preset.statusFilter),
    labelValue("Grade", preset.qualityGradeFilter),
    labelValue("Rule", preset.ruleFollowedFilter),
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : "No filters set";
}

function labelValue(label: string, value: string) {
  return value ? `${label}: ${value}` : "";
}

function dateLabel(value: string) {
  return dateFilters.find(([dateValue]) => dateValue === value)?.[1] ?? value;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}
