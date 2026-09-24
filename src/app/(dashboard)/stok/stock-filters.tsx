"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Category = { id: string; name: string };

export function StockFilters({ categories }: { categories: Category[] }) {
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Cari nama atau kode produk..."
          className="pl-9"
        />
      </div>

      <select
        className={selectCls}
        defaultValue={params.get("kategori") ?? "all"}
        onChange={(e) => setParam("kategori", e.target.value)}
      >
        <option value="all">Semua Kategori</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        className={selectCls}
        defaultValue={params.get("status") ?? "all"}
        onChange={(e) => setParam("status", e.target.value)}
      >
        <option value="all">Semua Status</option>
        <option value="AMAN">Aman</option>
        <option value="HAMPIR_HABIS">Hampir Habis</option>
        <option value="HABIS">Habis</option>
      </select>
    </div>
  );
}
