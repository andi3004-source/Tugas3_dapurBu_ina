import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDailyTrend, isoWeekToRange, monthToRange, summarizeRevenue } from "@/lib/period";
import { PESANAN_LAPORAN, TOTAL_PENDAPATAN_LAPORAN } from "./fixtures";

const mocks = vi.hoisted(() => ({
  prisma: { order: { findMany: vi.fn() } },
}));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import { getReport } from "@/lib/reports";

// Semua batas periode dihitung dalam WIB (UTC+7).
describe("U11 - Laporan periode", () => {
  it("U11-01 minggu 2026-W39 = Senin 21 Sep 00:00 WIB s.d. Minggu 27 Sep 23:59:59 WIB", () => {
    const r = isoWeekToRange("2026-W39");
    expect(r.start.toISOString()).toBe("2026-09-20T17:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-09-27T16:59:59.999Z");
    expect(r.label).toBe("Minggu ke-39, 2026");
  });

  it("U11-02 [batas] minggu 2027-W01 dimulai Senin 4 Jan 2027 (1 Jan jatuh hari Jumat)", () => {
    expect(isoWeekToRange("2027-W01").start.toISOString()).toBe("2027-01-03T17:00:00.000Z");
  });

  it("U11-03 [batas] minggu 2026-W53 melewati pergantian tahun (28 Des 2026 – 3 Jan 2027)", () => {
    const r = isoWeekToRange("2026-W53");
    expect(r.start.toISOString()).toBe("2026-12-27T17:00:00.000Z");
    expect(r.end.toISOString()).toBe("2027-01-03T16:59:59.999Z");
  });

  it("U11-04 bulan 2026-09 = 1 Sep 00:00 WIB s.d. 30 Sep 23:59:59 WIB, label September 2026", () => {
    const r = monthToRange("2026-09");
    expect(r.start.toISOString()).toBe("2026-08-31T17:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-09-30T16:59:59.999Z");
    expect(r.label).toBe("September 2026");
  });

  it("U11-05 [batas] Februari tahun kabisat 2028 berakhir tanggal 29", () => {
    expect(monthToRange("2028-02").end.toISOString()).toBe("2028-02-29T16:59:59.999Z");
  });

  it("U11-06 [salah] format periode tidak valid jatuh ke minggu ke-1 tahun berjalan", () => {
    expect(isoWeekToRange("minggu-ini").label).toBe(`Minggu ke-1, ${new Date().getFullYear()}`);
  });

  it("U11-07 penjumlahan pendapatan 3 pesanan contoh = Rp105.800, rata-rata Rp35.267", () => {
    expect(summarizeRevenue(PESANAN_LAPORAN)).toEqual({
      totalRevenue: TOTAL_PENDAPATAN_LAPORAN,
      totalTx: 3,
      avgTx: 35267,
    });
  });

  it("U11-08 [batas] periode tanpa transaksi → pendapatan 0 dan rata-rata 0 (tanpa bagi nol)", () => {
    expect(summarizeRevenue([])).toEqual({ totalRevenue: 0, totalTx: 0, avgTx: 0 });
  });

  it("U11-09 [batas] tren harian dikelompokkan per tanggal WIB (pesanan 01:00 WIB 23 Sep)", () => {
    expect(buildDailyTrend(PESANAN_LAPORAN).map(({ date, sales, orders }) => ({ date, sales, orders }))).toEqual([
      { date: "2026-09-21", sales: 88550, orders: 2 },
      { date: "2026-09-23", sales: 17250, orders: 1 },
    ]);
  });
});

describe("U11 - getReport dari data contoh (Prisma di-mock)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.order.findMany.mockResolvedValue(PESANAN_LAPORAN);
  });

  it("U11-10 laporan minggu 2026-W39: filter status PAID dalam rentang minggu, total Rp105.800", async () => {
    const report = await getReport({ type: "weekly", value: "2026-W39" });
    const where = mocks.prisma.order.findMany.mock.calls[0][0].where;
    expect(where.status).toBe("PAID");
    expect(where.createdAt.gte.toISOString()).toBe("2026-09-20T17:00:00.000Z");
    expect(where.createdAt.lte.toISOString()).toBe("2026-09-27T16:59:59.999Z");
    expect(report.summary).toEqual({
      totalRevenue: 105800,
      totalTx: 3,
      avgTx: 35267,
      topProduct: "Air Mineral",
    });
  });

  it("U11-11 rekap per kategori & per metode pembayaran dari data contoh", async () => {
    const report = await getReport({ type: "monthly", value: "2026-09" });
    expect(report.byCategory).toEqual([
      { name: "Makanan Utama", total: 64000 },
      { name: "Appetizer", total: 0 },
      { name: "Minuman", total: 28000 },
    ]);
    expect(report.byMethod.map(({ method, count, total }) => ({ method, count, total }))).toEqual([
      { method: "CASH", count: 1, total: 42550 },
      { method: "DEBIT", count: 1, total: 17250 },
      { method: "CREDIT_CARD", count: 0, total: 0 },
      { method: "QRIS", count: 1, total: 46000 },
    ]);
  });
});
