import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateBilling, calculateCharges, lineSubtotal } from "@/lib/billing";
import { MEJA_12_BILLING, MEJA_12_ITEMS, PRODUK, SERVICE_PERCENT, TAX_PERCENT } from "./fixtures";

const mocks = vi.hoisted(() => {
  const tx = {
    product: { findMany: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn() },
    order: { count: vi.fn(), create: vi.fn() },
    stockMovement: { create: vi.fn() },
  };
  return {
    tx,
    prisma: {
      setting: { findFirst: vi.fn() },
      $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
    },
  };
});
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/guards", () => ({
  requireCashier: vi.fn(async () => ({ user: { id: "u-kasir", role: "KASIR" } })),
  requireUser: vi.fn(async () => ({ user: { id: "u-kasir", role: "KASIR" } })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createOrder } from "@/actions/orders";

describe("U2 - Hitung billing", () => {
  it("U2-01 menghitung total billing Meja 12 = 42.550", () => {
    expect(calculateBilling(MEJA_12_ITEMS, TAX_PERCENT, SERVICE_PERCENT)).toEqual(MEJA_12_BILLING);
  });

  it("U2-02 subtotal item = harga × qty (Ayam Bakar Madu × 2 = 64.000)", () => {
    expect(lineSubtotal(PRODUK.ayamBakarMadu.price, 2)).toBe(64000);
  });

  it("U2-03 billing banyak qty: 2 Ayam Bakar Madu + 3 Air Mineral = 90.850", () => {
    const res = calculateBilling(
      [
        { price: 32000, quantity: 2 },
        { price: 5000, quantity: 3 },
      ],
      TAX_PERCENT,
      SERVICE_PERCENT,
    );
    expect(res).toEqual({ subtotal: 79000, tax: 7900, serviceCharge: 3950, total: 90850 });
  });

  it("U2-04 [batas] pajak 0% dan service 0% → total sama dengan subtotal", () => {
    expect(calculateBilling(MEJA_12_ITEMS, 0, 0)).toEqual({
      subtotal: 37000,
      tax: 0,
      serviceCharge: 0,
      total: 37000,
    });
  });

  it("U2-05 [batas] keranjang kosong → semua komponen 0", () => {
    expect(calculateBilling([], TAX_PERCENT, SERVICE_PERCENT)).toEqual({
      subtotal: 0,
      tax: 0,
      serviceCharge: 0,
      total: 0,
    });
  });

  it("U2-06 [batas] pembulatan rupiah: subtotal 12.345 → pajak 1.235, service 617", () => {
    expect(calculateCharges(12345, TAX_PERCENT, SERVICE_PERCENT)).toEqual({
      subtotal: 12345,
      tax: 1235,
      serviceCharge: 617,
      total: 14197,
    });
  });

  it("U2-07 [batas] pajak 100% (maksimum pengaturan) menggandakan subtotal", () => {
    expect(calculateCharges(37000, 100, 0).total).toBe(74000);
  });
});

describe("U2 - Hitung billing pada server action createOrder (Prisma di-mock)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-25T07:00:00.000Z")); // 14:00 WIB
    vi.clearAllMocks();
    mocks.prisma.setting.findFirst.mockResolvedValue({ taxPercent: 10, servicePercent: 5 });
    mocks.tx.product.findMany.mockResolvedValue([{ ...PRODUK.ayamBakarMadu }, { ...PRODUK.airMineral }]);
    mocks.tx.product.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.order.count.mockResolvedValue(0);
    mocks.tx.order.create.mockResolvedValue({ id: "ord-meja-12" });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("U2-08 createOrder menyimpan subtotal 37.000, pajak 3.700, service 1.850, total 42.550", async () => {
    const res = await createOrder({
      orderType: "DINE_IN",
      tableNumber: "12",
      items: [
        { productId: PRODUK.ayamBakarMadu.id, quantity: 1 },
        { productId: PRODUK.airMineral.id, quantity: 1 },
      ],
    });
    expect(res).toMatchObject({ ok: true, orderId: "ord-meja-12" });
    const data = mocks.tx.order.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      tableNumber: "12",
      status: "PENDING",
      ...MEJA_12_BILLING,
      orderNumber: "#TRX-20260925-0001",
    });
    expect(data.items.create).toEqual([
      expect.objectContaining({ productName: "Ayam Bakar Madu", price: 32000, quantity: 1, subtotal: 32000 }),
      expect.objectContaining({ productName: "Air Mineral", price: 5000, quantity: 1, subtotal: 5000 }),
    ]);
  });

  it("U2-09 [salah] Dine In tanpa nomor meja ditolak sebelum menyentuh database", async () => {
    const res = await createOrder({
      orderType: "DINE_IN",
      tableNumber: "  ",
      items: [{ productId: PRODUK.ayamBakarMadu.id, quantity: 1 }],
    });
    expect(res).toEqual({ ok: false, message: "Nomor meja wajib diisi untuk Dine In." });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });
});
