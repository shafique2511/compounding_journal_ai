import type { AppSettings, JournalState } from "@/types";
import { DEFAULT_JOURNAL_STATE } from "@/store/default-state";

const STORAGE_KEY = "trade-compounding-journal-ai";
const STORE_EVENT = "trade-compounding-journal-ai:update";

let cachedState: JournalState | null = null;

export function readJournalState(): JournalState {
  if (typeof window === "undefined") {
    return DEFAULT_JOURNAL_STATE;
  }

  if (cachedState) {
    return cachedState;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    cachedState = {
      ...DEFAULT_JOURNAL_STATE,
      settings: {
        ...DEFAULT_JOURNAL_STATE.settings,
        timezoneOffset: formatOffset(-new Date().getTimezoneOffset()),
      },
    };
    return cachedState;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<JournalState>;

    cachedState = {
      settings: { ...DEFAULT_JOURNAL_STATE.settings, ...parsedValue.settings },
      trades: parsedValue.trades ?? [],
      withdrawals: parsedValue.withdrawals ?? [],
      strategies: parsedValue.strategies ?? [],
      filterPresets: parsedValue.filterPresets ?? [],
      aiAnalyses: parsedValue.aiAnalyses ?? [],
    };
    return cachedState;
  } catch {
    cachedState = DEFAULT_JOURNAL_STATE;
    return cachedState;
  }
}

function formatOffset(offsetMinutes: number) {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (absoluteMinutes % 60).toString().padStart(2, "0");

  return `UTC${sign}${hours}:${minutes}`;
}

export function writeJournalState(state: JournalState) {
  cachedState = state;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function updateStoredSettings(settings: AppSettings) {
  const currentState = readJournalState();
  const nextState = { ...currentState, settings };
  writeJournalState(nextState);
  return nextState;
}

export function resetJournalStateCache() {
  cachedState = null;
}

export function subscribeToJournalState(listener: () => void) {
  window.addEventListener(STORE_EVENT, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(STORE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
