"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-background px-6 py-10">
          <section className="mx-auto max-w-xl rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              App Error
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The app caught an unexpected error instead of crashing. Try again, or return to the previous page.
            </p>
            <Button className="mt-5" onClick={reset} type="button">
              Try Again
            </Button>
          </section>
        </main>
      </body>
    </html>
  );
}
