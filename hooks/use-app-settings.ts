"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { AppSettings } from "@/types";
import {
  DEFAULT_SETTINGS,
  readJournalState,
  subscribeToJournalState,
  updateStoredSettings,
} from "@/store";

export function useAppSettings() {
  const journalState = useSyncExternalStore(
    subscribeToJournalState,
    readJournalState,
    () => ({ ...readJournalState(), settings: DEFAULT_SETTINGS }),
  );

  const settings = useMemo<AppSettings>(
    () => ({
      ...journalState.settings,
    }),
    [journalState.settings],
  );

  function saveSettings(nextSettings: AppSettings) {
    updateStoredSettings(nextSettings);
  }

  return {
    isLoaded: true,
    settings,
    saveSettings,
  };
}
