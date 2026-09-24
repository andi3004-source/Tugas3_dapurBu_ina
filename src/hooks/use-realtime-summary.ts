"use client";

import { useEffect, useState } from "react";

export type RealtimeSummary = {
  pendingCount: number;
  lowStockCount: number;
  notifCount: number;
  lastUpdated: string;
};

/**
 * Polling ringan ke /api/realtime/summary tiap `interval` ms.
 * Berhenti saat tab tidak aktif, lanjut saat kembali fokus.
 */
export function useRealtimeSummary(
  initial: { pendingCount: number; lowStockCount: number },
  interval = 5000,
) {
  const [data, setData] = useState<RealtimeSummary>({
    pendingCount: initial.pendingCount,
    lowStockCount: initial.lowStockCount,
    notifCount: initial.pendingCount + initial.lowStockCount,
    lastUpdated: new Date().toISOString(),
  });

  useEffect(() => {
    let active = true;
    async function fetchSummary() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/realtime/summary", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as RealtimeSummary;
        if (active) setData(json);
      } catch {
        /* diamkan error jaringan sementara */
      }
    }
    fetchSummary();
    const id = setInterval(fetchSummary, interval);
    document.addEventListener("visibilitychange", fetchSummary);
    return () => {
      active = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", fetchSummary);
    };
  }, [interval]);

  return data;
}
