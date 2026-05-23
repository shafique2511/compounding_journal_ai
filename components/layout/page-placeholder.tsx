type PagePlaceholderProps = {
  title: string;
  eyebrow?: string;
};

const metrics = [
  { label: "Net P/L", value: "$0.00", tone: "text-profit", border: "border-profit/20" },
  { label: "Drawdown", value: "0.00%", tone: "text-loss", border: "border-loss/20" },
  { label: "Withdrawals", value: "$0.00", tone: "text-withdrawal", border: "border-withdrawal/20" },
  { label: "Win Rate", value: "0.00%", tone: "text-analytics", border: "border-analytics/20" },
];

export function PagePlaceholder({ title, eyebrow = "Workspace" }: PagePlaceholderProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-lg border bg-card p-5 shadow-sm md:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              A protected trading workspace for individual trade records, compounding progress,
              strategy review, screenshots, risk controls, and AI analysis.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div className={`rounded-lg border bg-card p-4 shadow-sm ${metric.border}`} key={metric.label}>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {metric.label}
            </p>
            <p className={`mt-2 text-2xl font-semibold ${metric.tone}`}>{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold tracking-tight">Trade Review Surface</h3>
          <div className="mt-4 h-56 rounded-md border bg-muted/40" />
        </div>
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold tracking-tight">Risk Snapshot</h3>
          <div className="mt-4 space-y-3">
            <div className="h-3 rounded-full bg-profit/20" />
            <div className="h-3 rounded-full bg-loss/20" />
            <div className="h-3 rounded-full bg-withdrawal/20" />
            <div className="h-3 rounded-full bg-analytics/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
