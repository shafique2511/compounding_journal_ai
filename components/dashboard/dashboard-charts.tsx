"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartColors = ["#22c55e", "#ef4444", "#f97316", "#8b5cf6", "#64748b", "#3b82f6"];

export function ChartCard({
  data,
  dataKey,
  title,
  tone = "analytics",
  type,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  title: string;
  tone?: "analytics" | "loss" | "withdrawal";
  type: "area" | "bar" | "line";
}) {
  const color = tone === "loss" ? "#ef4444" : tone === "withdrawal" ? "#f97316" : "#8b5cf6";

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <div className="mt-4 h-60 min-[375px]:h-72 md:h-80 xl:h-96">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            {type === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line dataKey={dataKey} dot={data.length === 1} stroke={color} strokeWidth={2} type="monotone" />
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area dataKey={dataKey} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} type="monotone" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function PieChartCard({ data, title }: { data: { name: string; value: number }[]; title: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <div className="mt-4 h-60 min-[375px]:h-72 md:h-80 xl:h-96">
        {data.every((item) => item.value === 0) ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Tooltip />
              <Pie data={data} dataKey="value" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell fill={chartColors[index % chartColors.length]} key={entry.name} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm md:p-5">
      <div className="h-5 w-44 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-60 animate-pulse rounded-md border bg-muted/40 min-[375px]:h-72 md:h-80 xl:h-96" />
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-full place-items-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
      No data yet
    </div>
  );
}
