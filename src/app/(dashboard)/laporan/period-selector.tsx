"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PeriodSelector({
  type,
  value,
}: {
  type: "weekly" | "monthly";
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => p.set(k, v));
    router.replace(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Jenis Periode</Label>
          <div className="flex rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setParam({ type: "weekly" })}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-semibold",
                type === "weekly" ? "bg-primary text-white" : "text-muted-foreground",
              )}
            >
              Mingguan
            </button>
            <button
              onClick={() => setParam({ type: "monthly" })}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-semibold",
                type === "monthly" ? "bg-primary text-white" : "text-muted-foreground",
              )}
            >
              Bulanan
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{type === "weekly" ? "Pilih Minggu" : "Pilih Bulan"}</Label>
          <Input
            type={type === "weekly" ? "week" : "month"}
            value={value}
            onChange={(e) => setParam({ value: e.target.value })}
            className="w-auto"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Cetak / PDF
        </Button>
        <Button asChild>
          <a href={`/api/laporan/export?type=${type}&value=${encodeURIComponent(value)}`}>
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </Button>
      </div>
    </div>
  );
}
