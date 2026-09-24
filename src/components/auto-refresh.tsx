"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Memanggil router.refresh() secara berkala agar data server-component
 * ter-update tanpa reload manual. Berhenti saat tab tidak aktif, lanjut
 * saat tab kembali fokus.
 */
export function AutoRefresh({ interval = 5000 }: { interval?: number }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function start() {
      if (timer.current) return;
      timer.current = setInterval(() => {
        if (document.visibilityState === "visible") {
          router.refresh();
        }
      }, interval);
    }
    function stop() {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    }

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [interval, router]);

  return null;
}
