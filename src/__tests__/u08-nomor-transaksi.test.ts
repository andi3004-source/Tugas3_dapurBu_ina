import { describe, expect, it } from "vitest";
import { formatOrderNumber, orderDayRange } from "@/lib/order-number";

// Semua waktu ditulis dalam UTC; WIB = UTC+7.
const JAM_14_WIB_25_SEP = new Date("2026-09-25T07:00:00.000Z");

describe("U8 - Nomor transaksi", () => {
  it("U8-01 pesanan pertama 25 Sep 2026 bernomor #TRX-20260925-0001", () => {
    expect(formatOrderNumber(JAM_14_WIB_25_SEP, 0)).toBe("#TRX-20260925-0001");
  });

  it("U8-02 urutan melanjutkan jumlah pesanan hari itu (41 pesanan → 0042)", () => {
    expect(formatOrderNumber(JAM_14_WIB_25_SEP, 41)).toBe("#TRX-20260925-0042");
  });

  it("U8-03 [batas] urutan ke-9999 tetap 4 digit", () => {
    expect(formatOrderNumber(JAM_14_WIB_25_SEP, 9998)).toBe("#TRX-20260925-9999");
  });

  it("U8-04 format sesuai pola #TRX-YYYYMMDD-XXXX", () => {
    expect(formatOrderNumber(JAM_14_WIB_25_SEP, 6)).toMatch(/^#TRX-\d{8}-\d{4}$/);
  });

  it("U8-05 bulan & tanggal satu digit diberi nol di depan (5 Jan 2026 → 20260105)", () => {
    expect(formatOrderNumber(new Date("2026-01-05T03:00:00.000Z"), 0)).toBe("#TRX-20260105-0001");
  });

  it("U8-06 [batas] pesanan 00:30 WIB 25 Sep memakai tanggal 20260925 (bukan tanggal UTC 24 Sep)", () => {
    expect(formatOrderNumber(new Date("2026-09-24T17:30:00.000Z"), 0)).toBe("#TRX-20260925-0001");
  });

  it("U8-07 [batas] pesanan 23:59 WIB 24 Sep masih memakai tanggal 20260924", () => {
    expect(formatOrderNumber(new Date("2026-09-24T16:59:00.000Z"), 3)).toBe("#TRX-20260924-0004");
  });

  it("U8-08 rentang hitung urutan harian = 00:00–23:59:59.999 WIB", () => {
    const { start, end } = orderDayRange(JAM_14_WIB_25_SEP);
    expect(start.toISOString()).toBe("2026-09-24T17:00:00.000Z");
    expect(end.toISOString()).toBe("2026-09-25T16:59:59.999Z");
  });

  it("U8-09 [batas] pesanan 00:30 WIB dihitung di hari yang sama dengan pesanan 14:00 WIB", () => {
    const dini = orderDayRange(new Date("2026-09-24T17:30:00.000Z"));
    const siang = orderDayRange(JAM_14_WIB_25_SEP);
    expect(dini.start.toISOString()).toBe(siang.start.toISOString());
  });
});
