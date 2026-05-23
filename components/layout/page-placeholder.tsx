type PagePlaceholderProps = {
  title: string;
  eyebrow?: string;
};

export function PagePlaceholder({ title, eyebrow = "Phase 1 placeholder" }: PagePlaceholderProps) {
  return (
    <section className="rounded-lg border bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        This route is scaffolded for the project foundation. Functional trading workflows, data
        storage, and AI analysis will be added in later phases.
      </p>
    </section>
  );
}
