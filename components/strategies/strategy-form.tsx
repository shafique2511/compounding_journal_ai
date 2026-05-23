"use client";

import { ImagePlus, Save, Trash2, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth";
import { getFriendlyErrorMessage, logTechnicalError } from "@/lib/errors/app-error";
import { deleteStorageFile, saveStrategy, uploadStrategyScreenshot } from "@/lib/supabase";
import { getCurrentTimestamp } from "@/lib/time/timestamp";
import { strategyTemplates } from "@/src/data/strategyTemplates";
import { buildTemplateNotes } from "@/components/strategies/strategy-template-library";
import { useJournalStore } from "@/store";
import type { Strategy } from "@/types";

type StrategyFormValues = {
  strategyName: string;
  marketType: string;
  timeframe: string;
  entryRules: string;
  exitRules: string;
  stopLossRules: string;
  takeProfitRules: string;
  riskRules: string;
  exampleScreenshotUrl: string;
  notes: string;
  isActive: boolean;
};

export function StrategyForm({ strategy }: { strategy?: Strategy }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { upsertStrategy } = useJournalStore();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [strategyId] = useState(() => strategy?.id ?? crypto.randomUUID());
  const template = !strategy
    ? strategyTemplates.find((item) => item.id === searchParams.get("template"))
    : undefined;
  const form = useForm<StrategyFormValues>({
    defaultValues: {
      strategyName: strategy?.strategyName ?? template?.strategyName ?? "",
      marketType: strategy?.marketType ?? template?.marketType ?? "",
      timeframe: strategy?.timeframe ?? template?.timeframe ?? "",
      entryRules: strategy?.entryRules ?? template?.entryRules ?? "",
      exitRules: strategy?.exitRules ?? template?.exitRules ?? "",
      stopLossRules: strategy?.stopLossRules ?? template?.stopLossRules ?? "",
      takeProfitRules: strategy?.takeProfitRules ?? template?.takeProfitRules ?? "",
      riskRules: strategy?.riskRules ?? template?.riskRules ?? "",
      exampleScreenshotUrl: strategy?.exampleScreenshotUrl ?? "",
      notes: strategy?.notes ?? (template ? buildTemplateNotes(template) : ""),
      isActive: strategy?.isActive ?? true,
    },
  });
  const screenshotUrl = useWatch({ control: form.control, name: "exampleScreenshotUrl" });

  async function handleSubmit(values: StrategyFormValues) {
    setError("");

    if (!values.strategyName.trim()) {
      setError("Strategy name is required.");
      return;
    }

    const now = getCurrentTimestamp();
    const nextStrategy: Strategy = {
      id: strategyId,
      strategyName: values.strategyName.trim(),
      marketType: values.marketType.trim(),
      timeframe: values.timeframe.trim(),
      entryRules: values.entryRules.trim(),
      exitRules: values.exitRules.trim(),
      stopLossRules: values.stopLossRules.trim(),
      takeProfitRules: values.takeProfitRules.trim(),
      riskRules: values.riskRules.trim(),
      exampleScreenshotUrl: values.exampleScreenshotUrl || undefined,
      notes: values.notes.trim(),
      isActive: values.isActive,
      createdAt: strategy?.createdAt ?? now,
      updatedAt: now,
    };

    upsertStrategy(nextStrategy);

    if (user) {
      try {
        await saveStrategy(user.id, nextStrategy);
      } catch (caughtError) {
        logTechnicalError(caughtError, { action: "save strategy", source: "database" });
        setMessage(getFriendlyErrorMessage(caughtError, "Strategy saved locally. Supabase could not sync it."));
        return;
      }
    }

    router.push("/strategies");
  }

  async function handleScreenshotUpload(file: File | null) {
    if (!file) {
      return;
    }

    setError("");

    if (!user) {
      setError("Sign in before uploading a strategy screenshot.");
      return;
    }

    try {
      const url = await uploadStrategyScreenshot(user.id, strategyId, file);
      form.setValue("exampleScreenshotUrl", url, { shouldDirty: true });
    } catch (caughtError) {
      logTechnicalError(caughtError, { action: "upload strategy screenshot", source: "storage" });
      setError(getFriendlyErrorMessage(caughtError, "Screenshot upload failed. Check storage permissions and try again."));
    }
  }

  async function handleScreenshotDelete() {
    const url = form.getValues("exampleScreenshotUrl");
    form.setValue("exampleScreenshotUrl", "", { shouldDirty: true });

    if (url) {
      await deleteStorageFile(url).catch(() => undefined);
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Strategy Playbook
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          {strategy ? "Edit Strategy" : "Add Strategy"}
        </h2>
      </section>

      {error ? <p className="rounded-md border border-loss/30 bg-loss/10 p-3 text-sm text-loss">{error}</p> : null}
      {message ? <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">{message}</p> : null}

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight">Strategy Fields</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Input label="Strategy Name" {...form.register("strategyName")} />
          <Input label="Market Type" {...form.register("marketType")} />
          <Input label="Timeframe" {...form.register("timeframe")} />
          <label className="flex items-center gap-2 rounded-md border bg-background p-3 text-sm">
            <input type="checkbox" {...form.register("isActive")} />
            Active strategy
          </label>
        </div>
        <div className="mt-4 grid gap-4">
          <Textarea label="Entry Rules" {...form.register("entryRules")} />
          <Textarea label="Exit Rules" {...form.register("exitRules")} />
          <Textarea label="Stop Loss Rules" {...form.register("stopLossRules")} />
          <Textarea label="Take Profit Rules" {...form.register("takeProfitRules")} />
          <Textarea label="Risk Rules" {...form.register("riskRules")} />
          <Textarea label="Notes" {...form.register("notes")} />
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight">Example Screenshot</h3>
        <div className="mt-4 rounded-lg border bg-background p-4">
          <div className="grid min-h-56 place-items-center overflow-hidden rounded-md border bg-muted/30">
            {screenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Strategy example" className="max-h-72 w-full object-contain" src={screenshotUrl} />
            ) : (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <ImagePlus aria-hidden="true" className="size-8" />
                No screenshot uploaded
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
              <Upload aria-hidden="true" className="size-4" />
              {screenshotUrl ? "Replace" : "Upload"}
              <input
                accept="image/*"
                className="sr-only"
                onChange={(event) => handleScreenshotUpload(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>
            <Button disabled={!screenshotUrl} onClick={handleScreenshotDelete} type="button" variant="ghost">
              <Trash2 aria-hidden="true" className="size-4" />
              Delete
            </Button>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button onClick={() => router.push("/strategies")} type="button" variant="secondary">
          Cancel
        </Button>
        <Button type="submit">
          <Save aria-hidden="true" className="size-4" />
          Save Strategy
        </Button>
      </div>
    </form>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <input className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...props} />
    </label>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" {...props} />
    </label>
  );
}
