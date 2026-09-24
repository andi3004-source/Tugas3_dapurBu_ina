"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HistoryFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("tab", "riwayat");
    router.replace(`${pathname}?${next.toString()}`);
  }

  function clear() {
    const next = new URLSearchParams(params.toString());
    next.delete("dari");
    next.delete("sampai");
    next.set("tab", "riwayat");
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Dari Tanggal</Label>
        <Input
          type="date"
          className="w-auto"
          defaultValue={params.get("dari") ?? ""}
          onChange={(e) => setParam("dari", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Sampai Tanggal</Label>
        <Input
          type="date"
          className="w-auto"
          defaultValue={params.get("sampai") ?? ""}
          onChange={(e) => setParam("sampai", e.target.value)}
        />
      </div>
      <Button variant="outline" size="sm" onClick={clear}>
        Reset
      </Button>
    </div>
  );
}
