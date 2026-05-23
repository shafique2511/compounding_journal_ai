"use client";

import { Download, FileJson, RotateCcw, Upload } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { createFullBackup, parseBackup } from "@/lib/backup";
import {
  downloadFile,
  exportAiAnalysesToCsv,
  exportDashboardSummaryToCsv,
  exportFilterPresetsToJson,
  exportMistakeAnalysisToCsv,
  exportReviewReportToCsv,
  exportStrategiesToCsv,
  exportTradesToCsv,
} from "@/lib/export";
import { listUserDocuments, saveAiAnalysis, saveFilterPreset, saveStrategy, saveTrade, saveUserSettings } from "@/lib/supabase";
import { filterTrades, type TradeFilters } from "@/lib/trades/trade-ledger";
import { useJournalStore } from "@/store";
import type { AiAnalysis, FilterPreset, Strategy } from "@/types";

const emptyFilters: TradeFilters = {
  dateFrom: "",
  dateTo: "",
  qualityGrade: "",
  ruleFollowed: "",
  search: "",
  status: "",
  strategy: "",
  symbol: "",
  timeframe: "",
};
const timeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN1"];
const statuses = ["Win", "Loss", "Breakeven", "Running", "Cancelled"];
const grades = ["A+", "A", "B", "C", "D"];
const rules = ["Yes", "No", "Partially"];

export function ExportBackupPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    aiAnalyses,
    filterPresets,
    setAiAnalyses,
    setFilterPresets,
    setSettings,
    setStrategies,
    setTrades,
    settings,
    strategies,
    trades,
  } = useJournalStore();
  const [filters, setFilters] = useState<TradeFilters>(emptyFilters);
  const [pendingBackup, setPendingBackup] = useState<Awaited<ReturnType<typeof parseBackup>> | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    Promise.all([
      listUserDocuments<AiAnalysis>(user.id, "aiAnalyses"),
      listUserDocuments<Strategy>(user.id, "strategies"),
      listUserDocuments<FilterPreset>(user.id, "filterPresets"),
    ])
      .then(([remoteAiAnalyses, remoteStrategies, remoteFilterPresets]) => {
        setAiAnalyses(remoteAiAnalyses);
        if (remoteStrategies.length > 0) setStrategies(remoteStrategies);
        if (remoteFilterPresets.length > 0) setFilterPresets(remoteFilterPresets);
      })
      .catch(() => undefined);
  }, [setAiAnalyses, setFilterPresets, setStrategies, user]);

  const filteredTrades = useMemo(() => filterTrades(trades, filters), [filters, trades]);
  const symbols = unique(trades.map((trade) => trade.symbol));
  const strategyNames = unique(trades.map((trade) => trade.strategyName).filter(Boolean));

  function exportAllTrades() {
    runExport(() => downloadFile("all-trades.csv", exportTradesToCsv(trades), "text/csv"), "All trades exported.");
  }

  function exportFilteredTrades() {
    runExport(() => downloadFile("filtered-trades.csv", exportTradesToCsv(filteredTrades), "text/csv"), "Filtered trades exported.");
  }

  function exportDashboardSummary() {
    runExport(() => downloadFile("dashboard-summary.csv", exportDashboardSummaryToCsv(trades), "text/csv"), "Dashboard summary exported.");
  }

  function exportAiHistoryCsv() {
    runExport(() => downloadFile("ai-analysis-history.csv", exportAiAnalysesToCsv(aiAnalyses), "text/csv"), "AI analysis CSV exported.");
  }

  function exportAiHistoryJson() {
    runExport(() => downloadFile("ai-analysis-history.json", JSON.stringify(aiAnalyses, null, 2), "application/json"), "AI analysis JSON exported.");
  }

  function exportStrategyPlaybook() {
    runExport(() => downloadFile("strategy-playbook.csv", exportStrategiesToCsv(strategies), "text/csv"), "Strategy Playbook exported.");
  }

  function exportReviewReport() {
    runExport(() => downloadFile("review-report.csv", exportReviewReportToCsv(trades), "text/csv"), "Review report exported.");
  }

  function exportMistakeAnalysis() {
    runExport(() => downloadFile("mistake-analysis.csv", exportMistakeAnalysisToCsv(trades), "text/csv"), "Mistake analysis exported.");
  }

  function exportFilterPresets() {
    runExport(() => downloadFile("filter-presets.json", exportFilterPresetsToJson(filterPresets), "application/json"), "Filter presets exported.");
  }

  function backupAllData() {
    runExport(() => {
      const backup = createFullBackup({
        aiAnalyses,
        filterPresets,
        settings,
        strategies,
        trades,
      });
      downloadFile("trade-compounding-journal-backup.json", JSON.stringify(backup, null, 2), "application/json");
    }, "Full backup JSON exported.");
  }

  function runExport(action: () => void, successMessage: string) {
    try {
      action();
      setMessage(successMessage);
    } catch {
      setMessage("Export or backup failed. Check browser download permissions and try again.");
    }
  }

  async function prepareRestore(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setPendingBackup(parseBackup(await file.text()));
      setMessage("Backup validated. Confirm restore to replace local data.");
    } catch (error) {
      setPendingBackup(null);
      setMessage(error instanceof Error ? error.message : "Backup file is invalid.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function confirmRestore() {
    if (!pendingBackup) {
      return;
    }

    setSettings(pendingBackup.settings);
    setTrades(pendingBackup.trades);
    setAiAnalyses(pendingBackup.aiAnalyses);
    setStrategies(pendingBackup.strategies);
    setFilterPresets(pendingBackup.filterPresets);

    if (user) {
      await Promise.all([
        saveUserSettings(user.id, pendingBackup.settings),
        ...pendingBackup.trades.map((trade) => saveTrade(user.id, trade)),
        ...pendingBackup.aiAnalyses.map((analysis) => saveAiAnalysis(user.id, analysis)),
        ...pendingBackup.strategies.map((strategy) => saveStrategy(user.id, strategy)),
        ...pendingBackup.filterPresets.map((preset) => saveFilterPreset(user.id, preset)),
      ]).catch(() => undefined);
    }

    setPendingBackup(null);
    setMessage("Backup restored. Balances, checklist scores, and trade quality scores were recalculated.");
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Export / Backup</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Data Export, Backup, and Restore</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Export journal reports, download full backups, and restore validated backup files.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight">Filtered Trade Export</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4 xl:grid-cols-6">
          <Input placeholder="Search" value={filters.search} onChange={(value) => setFilters({ ...filters, search: value })} />
          <Input type="date" value={filters.dateFrom} onChange={(value) => setFilters({ ...filters, dateFrom: value })} />
          <Input type="date" value={filters.dateTo} onChange={(value) => setFilters({ ...filters, dateTo: value })} />
          <Select value={filters.symbol} onChange={(value) => setFilters({ ...filters, symbol: value })}>
            <option value="">All symbols</option>
            {symbols.map((symbol) => <option key={symbol}>{symbol}</option>)}
          </Select>
          <Select value={filters.timeframe} onChange={(value) => setFilters({ ...filters, timeframe: value })}>
            <option value="">All timeframes</option>
            {timeframes.map((timeframe) => <option key={timeframe}>{timeframe}</option>)}
          </Select>
          <Select value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}>
            <option value="">All status</option>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </Select>
          <Select value={filters.strategy} onChange={(value) => setFilters({ ...filters, strategy: value })}>
            <option value="">All strategies</option>
            {strategyNames.map((strategy) => <option key={strategy}>{strategy}</option>)}
          </Select>
          <Select value={filters.qualityGrade} onChange={(value) => setFilters({ ...filters, qualityGrade: value })}>
            <option value="">All grades</option>
            {grades.map((grade) => <option key={grade}>{grade}</option>)}
          </Select>
          <Select value={filters.ruleFollowed} onChange={(value) => setFilters({ ...filters, ruleFollowed: value })}>
            <option value="">All rule status</option>
            {rules.map((rule) => <option key={rule}>{rule}</option>)}
          </Select>
          <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
            {filteredTrades.length} matching trades
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight">Exports</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ExportButton label="Export All Trades CSV" onClick={exportAllTrades} />
          <ExportButton label="Export Filtered Trades CSV" onClick={exportFilteredTrades} />
          <ExportButton label="Export Dashboard Summary CSV" onClick={exportDashboardSummary} />
          <ExportButton label="Export AI History CSV" onClick={exportAiHistoryCsv} />
          <ExportButton label="Export AI History JSON" onClick={exportAiHistoryJson} icon={FileJson} />
          <ExportButton label="Export Strategy Playbook CSV" onClick={exportStrategyPlaybook} />
          <ExportButton label="Export Review Report CSV" onClick={exportReviewReport} />
          <ExportButton label="Export Mistake Analysis CSV" onClick={exportMistakeAnalysis} />
          <ExportButton label="Export Filter Presets JSON" onClick={exportFilterPresets} icon={FileJson} />
          <ExportButton label="Backup All User Data JSON" onClick={backupAllData} icon={FileJson} />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight">Restore</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Restore validates the backup file first. Confirm restore only after the validation message appears.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => fileInputRef.current?.click()} type="button" variant="secondary">
            <Upload aria-hidden="true" className="size-4" />
            Choose Backup JSON
          </Button>
          <input
            accept="application/json"
            className="hidden"
            onChange={(event) => void prepareRestore(event.target.files?.[0] ?? null)}
            ref={fileInputRef}
            type="file"
          />
          <Button disabled={!pendingBackup} onClick={() => void confirmRestore()} type="button">
            <RotateCcw aria-hidden="true" className="size-4" />
            Confirm Restore
          </Button>
        </div>
        {pendingBackup ? (
          <div className="mt-4 rounded-md border bg-background p-3 text-sm text-muted-foreground">
            Backup ready: {pendingBackup.trades.length} trades, {pendingBackup.aiAnalyses.length} AI analyses, {pendingBackup.strategies.length} strategies, {pendingBackup.filterPresets.length} presets.
          </div>
        ) : null}
      </section>

      {message ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-sm">{message}</p> : null}
    </section>
  );
}

function ExportButton({
  icon: Icon = Download,
  label,
  onClick,
}: {
  icon?: typeof Download;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button className="justify-start" onClick={onClick} type="button" variant="secondary">
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </Button>
  );
}

function Input({
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <input
      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
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
      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {children}
    </select>
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}
