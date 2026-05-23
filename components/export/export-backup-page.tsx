"use client";

import { Download, FileJson, RotateCcw, Upload } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { useEscapeToClose } from "@/hooks/use-escape-to-close";
import { getFriendlyErrorMessage, logTechnicalError } from "@/lib/errors/app-error";
import { parseBackup } from "@/lib/backup";
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
import { filterTrades, type TradeFilters } from "@/lib/trades/trade-ledger";
import {
  createBackupFromSupabase,
  loadBackupData,
  restoreBackupToSupabase,
  uploadBackup,
} from "@/src/services/backupService";
import { useJournalStore } from "@/store";

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
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState("");
  useEscapeToClose(Boolean(pendingBackup) && !isWorking, () => setPendingBackup(null));

  useEffect(() => {
    if (!user) {
      return;
    }

    loadBackupData(user.id)
      .then((remoteData) => {
        setSettings(remoteData.settings);
        setTrades(remoteData.trades);
        setAiAnalyses(remoteData.aiAnalyses);
        setStrategies(remoteData.strategies);
        setFilterPresets(remoteData.filterPresets);
      })
      .catch((caughtError) => {
        logTechnicalError(caughtError, { action: "load export data", source: "database" });
        setMessage("Supabase export data could not be loaded.");
      });
  }, [setAiAnalyses, setFilterPresets, setSettings, setStrategies, setTrades, user]);

  const filteredTrades = useMemo(() => filterTrades(trades, filters), [filters, trades]);
  const symbols = unique(trades.map((trade) => trade.symbol));
  const strategyNames = unique(trades.map((trade) => trade.strategyName).filter(Boolean));

  async function exportAllTrades() {
    await runExport(() => downloadFile("all-trades.csv", exportTradesToCsv(trades), "text/csv"), "All trades exported.");
  }

  async function exportFilteredTrades() {
    await runExport(() => downloadFile("filtered-trades.csv", exportTradesToCsv(filteredTrades), "text/csv"), "Filtered trades exported.");
  }

  async function exportDashboardSummary() {
    await runExport(() => downloadFile("dashboard-summary.csv", exportDashboardSummaryToCsv(trades), "text/csv"), "Dashboard summary exported.");
  }

  async function exportAiHistoryCsv() {
    await runExport(() => downloadFile("ai-analysis-history.csv", exportAiAnalysesToCsv(aiAnalyses), "text/csv"), "AI analysis CSV exported.");
  }

  async function exportAiHistoryJson() {
    await runExport(() => downloadFile("ai-analysis-history.json", JSON.stringify(aiAnalyses, null, 2), "application/json"), "AI analysis JSON exported.");
  }

  async function exportStrategyPlaybook() {
    await runExport(() => downloadFile("strategy-playbook.csv", exportStrategiesToCsv(strategies), "text/csv"), "Strategy Playbook exported.");
  }

  async function exportReviewReport() {
    await runExport(() => downloadFile("review-report.csv", exportReviewReportToCsv(trades), "text/csv"), "Review report exported.");
  }

  async function exportMistakeAnalysis() {
    await runExport(() => downloadFile("mistake-analysis.csv", exportMistakeAnalysisToCsv(trades), "text/csv"), "Mistake analysis exported.");
  }

  async function exportFilterPresets() {
    await runExport(() => downloadFile("filter-presets.json", exportFilterPresetsToJson(filterPresets), "application/json"), "Filter presets exported.");
  }

  async function backupAllData() {
    await runExport(async () => {
      const backup = user
        ? await createBackupFromSupabase(user.id)
        : { aiAnalyses, filterPresets, settings, strategies, trades, exportedAt: new Date().toISOString(), appVersion: "1.0.0" };
      downloadFile("trade-compounding-journal-backup.json", JSON.stringify(backup, null, 2), "application/json");
    }, "Full backup JSON exported.");
  }

  async function uploadBackupToSupabase() {
    if (!user) {
      setMessage("Login is required to upload backups to Supabase Storage.");
      return;
    }

    await runExport(async () => {
      const backup = await createBackupFromSupabase(user.id);
      await uploadBackup(user.id, backup);
    }, "Full backup uploaded to Supabase Storage.");
  }

  async function refreshFromSupabase() {
    if (!user) {
      setMessage("Login is required to refresh Supabase export data.");
      return;
    }

    await runExport(async () => {
      const remoteData = await loadBackupData(user.id);
      setSettings(remoteData.settings);
      setTrades(remoteData.trades);
      setAiAnalyses(remoteData.aiAnalyses);
      setStrategies(remoteData.strategies);
      setFilterPresets(remoteData.filterPresets);
    }, "Supabase export data refreshed.");
  }

  async function runExport(action: () => void | Promise<void>, successMessage: string) {
    setIsWorking(true);
    setMessage("");

    try {
      await action();
      setMessage(successMessage);
    } catch (error) {
      logTechnicalError(error, { action: "export or backup", source: "export" });
      setMessage(getFriendlyErrorMessage(error, "Export or backup failed. Check permissions and try again."));
    } finally {
      setIsWorking(false);
    }
  }

  async function prepareRestore(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const parsedBackup = parseBackup(await file.text());
      setPendingBackup(parsedBackup);
      setMessage("Backup validated. Confirm restore to replace local data.");
    } catch (error) {
      logTechnicalError(error, { action: "parse backup", source: "backup" });
      setPendingBackup(null);
      setMessage(getFriendlyErrorMessage(error, "Backup file is invalid."));
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

    if (!user) {
      setMessage("Login is required to restore data to Supabase.");
      return;
    }

    setIsWorking(true);
    setMessage("");

    try {
      const restoredBackup = await restoreBackupToSupabase(user.id, pendingBackup);
      setSettings(restoredBackup.settings);
      setTrades(restoredBackup.trades);
      setAiAnalyses(restoredBackup.aiAnalyses);
      setStrategies(restoredBackup.strategies);
      setFilterPresets(restoredBackup.filterPresets);
      setPendingBackup(null);
      setMessage("Backup restored. Balances, checklist scores, trade quality scores, and dashboard data were recalculated.");
    } catch (error) {
      logTechnicalError(error, { action: "restore backup", source: "backup" });
      setMessage(getFriendlyErrorMessage(error, "Restore failed. No invalid backup data was restored."));
    } finally {
      setIsWorking(false);
    }
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
          <ExportButton description="Download every saved trade as a CSV file." label="Export All Trades CSV" onClick={exportAllTrades} />
          <ExportButton description="Download only trades matching the filters above." label="Export Filtered Trades CSV" onClick={exportFilteredTrades} />
          <ExportButton description="Download key dashboard metrics for reporting." label="Export Dashboard Summary CSV" onClick={exportDashboardSummary} />
          <ExportButton description="Download AI coaching history as CSV." label="Export AI History CSV" onClick={exportAiHistoryCsv} />
          <ExportButton description="Download AI coaching history as JSON." label="Export AI History JSON" onClick={exportAiHistoryJson} icon={FileJson} />
          <ExportButton description="Download strategy playbook rules." label="Export Strategy Playbook CSV" onClick={exportStrategyPlaybook} />
          <ExportButton description="Download review status and review notes." label="Export Review Report CSV" onClick={exportReviewReport} />
          <ExportButton description="Download mistake tag performance summary." label="Export Mistake Analysis CSV" onClick={exportMistakeAnalysis} />
          <ExportButton description="Download saved filter presets." label="Export Filter Presets JSON" onClick={exportFilterPresets} icon={FileJson} />
          <ExportButton description="Download settings, trades, AI history, strategies, and presets." label="Backup All User Data JSON" onClick={backupAllData} icon={FileJson} />
          <ExportButton description="Store a private backup in Supabase Storage." label="Upload Backup to Supabase" onClick={uploadBackupToSupabase} icon={Upload} />
          <ExportButton description="Reload export data from Supabase." label="Refresh Supabase Data" onClick={refreshFromSupabase} icon={RotateCcw} />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight">Restore</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Restore validates the backup file first. Confirm restore only after the validation message appears.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button className="h-11 w-full justify-start" onClick={() => fileInputRef.current?.click()} type="button" variant="secondary">
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
          <Button className="h-11 w-full justify-start" disabled={!pendingBackup || isWorking} onClick={() => void confirmRestore()} type="button">
            <RotateCcw aria-hidden="true" className="size-4" />
            {isWorking ? "Working..." : "Confirm Restore"}
          </Button>
        </div>
        {pendingBackup ? (
          <div className="mt-4 rounded-md border bg-background p-3 text-sm text-muted-foreground">
            Backup ready: {pendingBackup.trades.length} trades, {pendingBackup.aiAnalyses.length} AI analyses, {pendingBackup.strategies.length} strategies, {pendingBackup.filterPresets.length} presets.
          </div>
        ) : null}
      </section>

      {message ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-sm">{message}</p> : null}

      {pendingBackup ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border bg-card p-4 shadow-lg">
            <h3 className="text-lg font-semibold">Confirm restore</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This validated backup will replace your current Supabase journal data. Existing balances and quality scores will be recalculated.
            </p>
            <div className="mt-4 rounded-md border bg-background p-3 text-sm text-muted-foreground">
              {pendingBackup.trades.length} trades, {pendingBackup.aiAnalyses.length} AI analyses, {pendingBackup.strategies.length} strategies, {pendingBackup.filterPresets.length} presets.
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button onClick={() => setPendingBackup(null)} type="button" variant="secondary">Cancel</Button>
              <Button disabled={isWorking} onClick={() => void confirmRestore()} type="button">{isWorking ? "Restoring..." : "Restore Data"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ExportButton({
  icon: Icon = Download,
  label,
  onClick,
  description,
}: {
  description: string;
  icon?: typeof Download;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
          <Icon aria-hidden="true" className="size-4" />
        </div>
        <div className="min-w-0">
          <h4 className="font-medium">{label}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button className="mt-4 h-11 w-full justify-center" onClick={onClick} type="button" variant="secondary">
        {label}
      </Button>
    </div>
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
      className="h-11 w-full rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm"
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
      className="h-11 w-full rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm"
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
