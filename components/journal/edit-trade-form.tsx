"use client";

import { TradeForm } from "@/components/journal/trade-form";
import { useJournalStore } from "@/store";

export function EditTradeForm({ tradeId }: { tradeId: string }) {
  const trade = useJournalStore((state) => state.trades.find((item) => item.id === tradeId));

  if (!trade) {
    return (
      <section className="rounded-lg border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        Trade not found.
      </section>
    );
  }

  return <TradeForm trade={trade} />;
}
