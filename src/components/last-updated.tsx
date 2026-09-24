"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Menampilkan "Diperbarui X detik lalu". Reset otomatis setiap kali komponen
 * di-render ulang oleh router.refresh() (karena `key`/mount berubah pada data baru).
 */
export function LastUpdated() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const text =
    seconds < 2 ? "Baru saja" : seconds < 60 ? `${seconds} detik lalu` : `${Math.floor(seconds / 60)} menit lalu`;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-2.5 py-1 text-xs text-muted-foreground">
      <RefreshCw className="h-3 w-3 text-brand-leaf" />
      Diperbarui {text}
    </span>
  );
}
