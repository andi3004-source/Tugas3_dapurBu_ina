"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Status = "checking" | "online" | "offline";

export function ConnectionStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>("checking");
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.database === "connected") {
          setStatus("online");
          setLatency(data.latencyMs ?? null);
        } else {
          setStatus("offline");
        }
      } catch {
        if (active) setStatus("offline");
      }
    }
    check();
    const id = setInterval(check, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const color =
    status === "online" ? "bg-brand-leaf" : status === "offline" ? "bg-brand-chili" : "bg-amber-400";
  const label =
    status === "online" ? "Online" : status === "offline" ? "Offline" : "Memeriksa...";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-xs",
        compact ? "" : "bg-muted/60",
      )}
    >
      <span className="relative flex h-2.5 w-2.5">
        {status === "online" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-leaf opacity-75" />
        )}
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", color)} />
      </span>
      <span className="font-semibold text-navy">{label}</span>
      {status === "online" && latency !== null && (
        <span className="text-muted-foreground">· DB {latency}ms</span>
      )}
    </div>
  );
}
