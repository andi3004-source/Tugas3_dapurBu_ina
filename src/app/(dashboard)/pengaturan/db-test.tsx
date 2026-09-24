"use client";

import { useState } from "react";
import { Database, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Result =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; latencyMs: number }
  | { status: "error"; message: string };

export function DbTest() {
  const [result, setResult] = useState<Result>({ status: "idle" });

  async function test() {
    setResult({ status: "loading" });
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.database === "connected") {
        setResult({ status: "ok", latencyMs: data.latencyMs });
      } else {
        setResult({ status: "error", message: data.message ?? "Koneksi gagal" });
      }
    } catch (e) {
      setResult({ status: "error", message: e instanceof Error ? e.message : "Gagal terhubung" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Database className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-navy">PostgreSQL</p>
          <p className="text-xs text-muted-foreground">
            Endpoint health check: <span className="font-mono">/api/health</span>
          </p>
        </div>
        {result.status === "ok" && (
          <span className="flex items-center gap-1.5 rounded-lg bg-brand-leaf/15 px-3 py-1.5 text-sm font-semibold text-[#4f6a2f]">
            <CheckCircle2 className="h-4 w-4" /> Terhubung · {result.latencyMs}ms
          </span>
        )}
        {result.status === "error" && (
          <span className="flex items-center gap-1.5 rounded-lg bg-brand-chili/15 px-3 py-1.5 text-sm font-semibold text-brand-chili">
            <XCircle className="h-4 w-4" /> Gagal
          </span>
        )}
      </div>

      {result.status === "error" && (
        <p className="rounded-xl bg-brand-chili/10 p-3 text-xs text-brand-chili">{result.message}</p>
      )}

      <Button onClick={test} disabled={result.status === "loading"} variant="outline">
        <RefreshCw className={cn("h-4 w-4", result.status === "loading" && "animate-spin")} />
        {result.status === "loading" ? "Menguji..." : "Tes Koneksi"}
      </Button>
    </div>
  );
}
