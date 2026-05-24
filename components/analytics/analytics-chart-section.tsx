"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AnalyticsChartSection({
  data,
  title,
  valueKey,
}: {
  data: { mistakeCount: number; name: string; netProfit: number; qualityScore: number }[];
  title: string;
  valueKey: "mistakeCount" | "netProfit" | "qualityScore";
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <div className="mt-4 h-64 rounded-lg border bg-background p-3 md:h-80 xl:h-96">
        {data.length > 0 ? (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey={valueKey} fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">No strategy data yet</div>
        )}
      </div>
    </section>
  );
}

export function AnalyticsChartSkeleton() {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
      <div className="h-5 w-56 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-64 animate-pulse rounded-lg border bg-muted/40 md:h-80 xl:h-96" />
    </section>
  );
}
