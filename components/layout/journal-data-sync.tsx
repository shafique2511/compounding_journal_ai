"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth";
import { logTechnicalError } from "@/lib/errors/app-error";
import { loadBackupData } from "@/src/services/backupService";
import { DEFAULT_SETTINGS, useJournalStore } from "@/store";

export function JournalDataSync() {
  const { user } = useAuth();
  const {
    setAiAnalyses,
    setFilterPresets,
    setSettings,
    setStrategies,
    setTrades,
    setWithdrawals,
  } = useJournalStore();

  useEffect(() => {
    let isCancelled = false;

    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setTrades([]);
      setStrategies([]);
      setFilterPresets([]);
      setAiAnalyses([]);
      setWithdrawals([]);
      return;
    }

    loadBackupData(user.id)
      .then((data) => {
        if (isCancelled) {
          return;
        }

        setSettings(data.settings);
        setTrades(data.trades);
        setStrategies(data.strategies);
        setFilterPresets(data.filterPresets);
        setAiAnalyses(data.aiAnalyses);
        setWithdrawals([]);
      })
      .catch((caughtError) => {
        logTechnicalError(caughtError, { action: "sync journal data", source: "database" });
      });

    return () => {
      isCancelled = true;
    };
  }, [
    setAiAnalyses,
    setFilterPresets,
    setSettings,
    setStrategies,
    setTrades,
    setWithdrawals,
    user,
  ]);

  return null;
}
