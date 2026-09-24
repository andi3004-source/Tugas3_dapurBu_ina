import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format angka rupiah, mis. 25000 -> "Rp 25.000" */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

/** Angka biasa dengan pemisah ribuan Indonesia */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value ?? 0);
}

/** Rupiah dalam juta untuk grafik, mis. 4280000 -> "4,28 jt" */
export function formatJuta(value: number): string {
  return `${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((value ?? 0) / 1_000_000)} jt`;
}

const TZ = "Asia/Jakarta";

/** "Rabu, 23 September 2026" */
export function formatTanggalPanjang(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(date);
}

/** "23 Sep 2026, 14:32" */
export function formatTanggalWaktu(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);
}

/** "14:32" */
export function formatWaktu(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);
}

export type StockStatus = "AMAN" | "HAMPIR_HABIS" | "HABIS";

export function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return "HABIS";
  if (stock <= minStock) return "HAMPIR_HABIS";
  return "AMAN";
}

export const stockStatusLabel: Record<StockStatus, string> = {
  AMAN: "Aman",
  HAMPIR_HABIS: "Hampir Habis",
  HABIS: "Habis",
};

export function persen(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
