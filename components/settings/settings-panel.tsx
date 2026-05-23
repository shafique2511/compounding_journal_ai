"use client";

import { useMemo, useState } from "react";
import { BrainCircuit, Monitor, Moon, RotateCcw, Save, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { settingsSchema } from "@/lib/validation";
import { formatTimezoneOffset, getBrowserTimezoneOffsetMinutes } from "@/lib/time/local-time";
import { useAppSettings } from "@/hooks";
import type { AppSettings } from "@/types";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
];

const aiProviderOptions = [
  { value: "openai" as const, label: "OpenAI", icon: BrainCircuit },
  { value: "gemini" as const, label: "Gemini", icon: Sparkles },
];

export function SettingsPanel() {
  const { isLoaded, settings, saveSettings } = useAppSettings();

  if (!isLoaded) {
    return (
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading local settings...</p>
      </section>
    );
  }

  return (
    <SettingsForm
      initialSettings={settings}
      key={`${settings.theme}-${settings.aiProvider}-${settings.timezoneOffsetMinutes}-${settings.accountStartingBalance}-${settings.accountCurrency}`}
      onSave={saveSettings}
    />
  );
}

function SettingsForm({
  initialSettings,
  onSave,
}: Readonly<{
  initialSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
}>) {
  const { setTheme } = useTheme();
  const [draft, setDraft] = useState<AppSettings>(() => initialSettings);
  const [message, setMessage] = useState("");
  const previewLabel = useMemo(
    () => formatTimezoneOffset(Number(draft.timezoneOffsetMinutes)),
    [draft.timezoneOffsetMinutes],
  );

  function handleSave() {
    const parsedSettings = settingsSchema.safeParse(draft);

    if (!parsedSettings.success) {
      setMessage(parsedSettings.error.issues[0]?.message ?? "Settings are invalid.");
      return;
    }

    onSave(parsedSettings.data);
    setTheme(parsedSettings.data.theme);
    setMessage("Settings saved on this device.");
  }

  function handleUseBrowserOffset() {
    setDraft((current) => ({
      ...current,
      timezoneOffsetMinutes: getBrowserTimezoneOffsetMinutes(),
    }));
    setMessage("");
  }

  return (
    <section className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Local app preferences</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Trade entry times use the browser/device local date and time. The timezone offset below is
          stored as a manual preference and can be adjusted when reviewing trades from another
          timezone.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Starting balance</span>
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            min="0"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                accountStartingBalance: Number(event.target.value),
              }))
            }
            type="number"
            value={draft.accountStartingBalance}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Account currency</span>
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm uppercase outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            maxLength={8}
            onChange={(event) =>
              setDraft((current) => ({ ...current, accountCurrency: event.target.value }))
            }
            value={draft.accountCurrency}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Manual timezone offset in minutes</span>
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            max="840"
            min="-840"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                timezoneOffsetMinutes: Number(event.target.value),
              }))
            }
            type="number"
            value={draft.timezoneOffsetMinutes}
          />
          <span className="block text-xs text-muted-foreground">{previewLabel}</span>
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium">Theme</span>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = draft.theme === option.value;

              return (
                <button
                  className={cn(
                    "flex h-10 items-center justify-center gap-2 rounded-md border text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-accent",
                  )}
                  key={option.value}
                  onClick={() => {
                    setDraft((current) => ({ ...current, theme: option.value }));
                    setTheme(option.value);
                    setMessage("");
                  }}
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">AI provider</span>
          <div className="grid grid-cols-2 gap-2">
            {aiProviderOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = draft.aiProvider === option.value;

              return (
                <button
                  className={cn(
                    "flex h-10 items-center justify-center gap-2 rounded-md border text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-accent",
                  )}
                  key={option.value}
                  onClick={() => {
                    setDraft((current) => ({ ...current, aiProvider: option.value }));
                    setMessage("");
                  }}
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center">
        <Button onClick={handleSave} type="button">
          <Save aria-hidden="true" className="size-4" />
          Save Settings
        </Button>
        <Button onClick={handleUseBrowserOffset} type="button" variant="secondary">
          <RotateCcw aria-hidden="true" className="size-4" />
          Use Browser Offset
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </section>
  );
}
