import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateCashPayment, validatePaymentInput } from "@/lib/billing";
import { paymentSchema } from "@/lib/validations";
import { MEJA_12_BILLING, TUNAI } from "./fixtures";

const mocks = vi.hoisted(() => {
  const tx = {
    order: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    payment: { create: vi.fn() },
  };
  return {
    tx,
    prisma: { $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)) },
  };
});
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/guards", () => ({
  requireCashier: vi.fn(async () => ({ user: { id: "u-kasir", role: "KASIR" } })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { confirmPayment } from "@/actions/payments";

const TOTAL = MEJA_12_BILLING.total;

describe("U3 - Pembayaran tunai", () => {
  it("U3-01 [salah] uang Rp0 → uang kurang, kekurangan Rp42.550", () => {
    expect(calculateCashPayment(TOTAL, TUNAI.kosong)).toEqual({ enough: false, change: 0, shortfall: 42550 });
  });

  it("U3-02 [batas] uang Rp42.549 (kurang 1 rupiah) → uang kurang", () => {
    expect(calculateCashPayment(TOTAL, TUNAI.kurangSeRupiah)).toEqual({ enough: false, change: 0, shortfall: 1 });
  });

  it("U3-03 [batas] uang pas Rp42.550 → kembalian Rp0", () => {
    expect(calculateCashPayment(TOTAL, TUNAI.pas)).toEqual({ enough: true, change: 0, shortfall: 0 });
  });

  it("U3-04 uang Rp50.000 → kembalian Rp7.450", () => {
    expect(calculateCashPayment(TOTAL, TUNAI.limaPuluhRibu)).toEqual({ enough: true, change: 7450, shortfall: 0 });
  });

  it("U3-05 validasi kasir: tunai kurang → CASH_SHORT, tunai pas → lolos", () => {
    expect(validatePaymentInput("CASH", { total: TOTAL, cash: TUNAI.kurangSeRupiah })).toBe("CASH_SHORT");
    expect(validatePaymentInput("CASH", { total: TOTAL, cash: TUNAI.pas })).toBeNull();
  });

  it("U3-06 [salah] skema pembayaran menolak nominal negatif", () => {
    const res = paymentSchema.safeParse({ orderId: "ord-1", method: "CASH", amountPaid: -1 });
    expect(res.success).toBe(false);
  });
});

describe("U3 - confirmPayment tunai (Prisma di-mock)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tx.order.findUniqueOrThrow.mockResolvedValue({
      id: "ord-meja-12",
      status: "PENDING",
      total: TOTAL,
      payment: null,
    });
  });

  it("U3-07 [salah] uang Rp42.549 ditolak & pembayaran tidak disimpan", async () => {
    const res = await confirmPayment({ orderId: "ord-meja-12", method: "CASH", amountPaid: TUNAI.kurangSeRupiah });
    expect(res).toEqual({ ok: false, message: "Uang tunai kurang dari total tagihan." });
    expect(mocks.tx.payment.create).not.toHaveBeenCalled();
    expect(mocks.tx.order.update).not.toHaveBeenCalled();
  });

  it("U3-08 uang Rp50.000 disimpan dengan kembalian Rp7.450 dan status Lunas", async () => {
    const res = await confirmPayment({ orderId: "ord-meja-12", method: "CASH", amountPaid: TUNAI.limaPuluhRibu });
    expect(res.ok).toBe(true);
    expect(mocks.tx.payment.create.mock.calls[0][0].data).toMatchObject({
      method: "CASH",
      amountPaid: 50000,
      change: 7450,
    });
    expect(mocks.tx.order.update).toHaveBeenCalledWith({ where: { id: "ord-meja-12" }, data: { status: "PAID" } });
  });

  it("U3-09 [salah] pesanan yang sudah Lunas tidak bisa dibayar dua kali", async () => {
    mocks.tx.order.findUniqueOrThrow.mockResolvedValue({
      id: "ord-meja-12",
      status: "PAID",
      total: TOTAL,
      payment: { id: "pay-1" },
    });
    const res = await confirmPayment({ orderId: "ord-meja-12", method: "CASH", amountPaid: TUNAI.pas });
    expect(res).toEqual({ ok: false, message: "Pesanan ini sudah dibayar." });
    expect(mocks.tx.payment.create).not.toHaveBeenCalled();
  });
});
