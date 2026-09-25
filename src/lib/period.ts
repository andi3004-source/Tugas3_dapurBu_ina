import { APP_TIME_ZONE, wibDate, wibParts } from "@/lib/timezone";

export type Period =
  | { type: "weekly"; value: string } // "2026-W39"
  | { type: "monthly"; value: string }; // "2026-09"

/** Ubah ISO week string "2026-W39" menjadi rentang Senin 00:00 – Minggu 23:59:59.999 WIB. */
export function isoWeekToRange(value: string): { start: Date; end: Date; label: string } {
  const m = value.match(/^(\d{4})-W(\d{2})$/);
  const now = wibParts(new Date());
  const year = m ? Number(m[1]) : now.year;
  const week = m ? Number(m[2]) : 1;

  // Kamis minggu pertama menentukan tahun ISO
  const simpleDay = 1 + (week - 1) * 7;
  const dow = new Date(Date.UTC(year, 0, simpleDay)).getUTCDay();
  const mondayDay = dow <= 4 ? simpleDay - dow + 1 : simpleDay + 8 - dow;

  return {
    start: wibDate(year, 0, mondayDay),
    end: wibDate(year, 0, mondayDay + 6, 23, 59, 59, 999),
    label: `Minggu ke-${week}, ${year}`,
  };
}

/** Ubah "2026-09" menjadi rentang tanggal 1 00:00 – akhir bulan 23:59:59.999 WIB. */
export function monthToRange(value: string): { start: Date; end: Date; label: string } {
  const m = value.match(/^(\d{4})-(\d{2})$/);
  const now = wibParts(new Date());
  const year = m ? Number(m[1]) : now.year;
  const month = m ? Number(m[2]) - 1 : now.month;
  const start = wibDate(year, month, 1);
  const end = wibDate(year, month + 1, 0, 23, 59, 59, 999);
  const label = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(start);
  return { start, end, label };
}

export function periodToRange(period: Period) {
  return period.type === "weekly" ? isoWeekToRange(period.value) : monthToRange(period.value);
}

type RevenueOrder = { total: number; createdAt: Date };

/** Total pendapatan, jumlah transaksi, dan rata-rata per transaksi. */
export function summarizeRevenue(orders: RevenueOrder[]) {
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalTx = orders.length;
  const avgTx = totalTx ? Math.round(totalRevenue / totalTx) : 0;
  return { totalRevenue, totalTx, avgTx };
}

/** Kunci tanggal WIB "YYYY-MM-DD" untuk pengelompokan tren harian. */
export function dayKey(date: Date): string {
  const { year, month, day } = wibParts(date);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Tren harian: penjualan & jumlah pesanan per tanggal, urut naik. */
export function buildDailyTrend(orders: RevenueOrder[]) {
  const trendMap = new Map<string, { sales: number; orders: number }>();
  for (const o of orders) {
    const key = dayKey(o.createdAt);
    const cur = trendMap.get(key) ?? { sales: 0, orders: 0 };
    cur.sales += o.total;
    cur.orders += 1;
    trendMap.set(key, cur);
  }
  return [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      label: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", timeZone: "UTC" }).format(
        new Date(date),
      ),
      ...v,
    }));
}
