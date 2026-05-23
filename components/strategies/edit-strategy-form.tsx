"use client";

import { StrategyForm } from "@/components/strategies/strategy-form";
import { useJournalStore } from "@/store";

export function EditStrategyForm({ strategyId }: { strategyId: string }) {
  const strategy = useJournalStore((state) => state.strategies.find((item) => item.id === strategyId));

  if (!strategy) {
    return (
      <section className="rounded-lg border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        Strategy not found.
      </section>
    );
  }

  return <StrategyForm strategy={strategy} />;
}
