import { wibDate, wibParts } from "@/lib/timezone";

/** Rentang satu hari WIB (00:00:00.000 – 23:59:59.999) untuk tanggal `now`. */
export function orderDayRange(now: Date): { start: Date; end: Date } {
  const { year, month, day } = wibParts(now);
  return {
    start: wibDate(year, month, day),
    end: wibDate(year, month, day, 23, 59, 59, 999),
  };
}

/** Nomor transaksi format #TRX-YYYYMMDD-XXXX (tanggal WIB); `countToday` = jumlah pesanan hari itu. */
export function formatOrderNumber(now: Date, countToday: number): string {
  const { year, month, day } = wibParts(now);
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  const seq = String(countToday + 1).padStart(4, "0");
  return `#TRX-${year}${m}${d}-${seq}`;
}
