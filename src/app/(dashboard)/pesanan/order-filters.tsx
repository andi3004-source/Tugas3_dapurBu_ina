"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  const selectCls =
    "h-10 rounded-xl border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Status</Label>
        <select
          className={`${selectCls} block`}
          defaultValue={params.get("status") ?? "all"}
          onChange={(e) => setParam("status", e.target.value)}
        >
          <option value="all">Semua Status</option>
          <option value="PENDING">Menunggu</option>
          <option value="PAID">Lunas</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Tanggal</Label>
        <Input
          type="date"
          className="w-auto"
          defaultValue={params.get("tanggal") ?? ""}
          onChange={(e) => setParam("tanggal", e.target.value)}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.replace(pathname)}
      >
        Reset
      </Button>
    </div>
  );
}
