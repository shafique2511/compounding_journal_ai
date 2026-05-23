import Link from "next/link";
import { LogoutButton } from "@/components/auth";
import { NAV_ITEMS } from "@/lib/constants/navigation";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card px-4 py-6 md:block">
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">Trading Journal</p>
        <h1 className="text-xl font-semibold tracking-tight">Trade Compounding Journal AI</h1>
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="absolute inset-x-4 bottom-6">
        <LogoutButton />
      </div>
    </aside>
  );
}
