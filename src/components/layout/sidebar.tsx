"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForRole } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { ConnectionStatus } from "@/components/layout/connection-status";
import { ActiveTableCard } from "@/components/layout/active-table-card";
import { useRealtimeSummary } from "@/hooks/use-realtime-summary";

export function Sidebar({
  role,
  pendingCount,
  lowStockCount,
  brandName,
  tagline,
}: {
  role: "ADMIN" | "KASIR";
  pendingCount: number;
  lowStockCount: number;
  brandName: string;
  tagline: string;
}) {
  const pathname = usePathname();
  const items = navForRole(role);
  const summary = useRealtimeSummary({ pendingCount, lowStockCount });

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-border bg-card lg:flex">
      <div className="border-b border-border px-6 py-5">
        <Logo name={brandName} tagline={tagline} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-accent text-primary before:absolute before:inset-y-1.5 before:-left-0.5 before:w-1 before:rounded-full before:bg-brand-gold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.badge === "pending" && summary.pendingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-chili px-1.5 text-xs font-bold text-white">
                  {summary.pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 px-4 pb-4">
        <ActiveTableCard />
        <div className="rounded-xl bg-muted/50 p-3 text-center text-xs text-muted-foreground">
          <p className="font-serif font-semibold text-brand-teal">{brandName}</p>
          <p>Sistem Manajemen Restoran</p>
          <p className="mt-0.5">v1.0.0</p>
        </div>
        <ConnectionStatus />
      </div>
    </aside>
  );
}
