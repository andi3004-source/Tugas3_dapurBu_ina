import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateStockAdjustment, calculateStockIn } from "@/lib/stock";
import { stockAdjustSchema, stockInSchema } from "@/lib/validations";
import { PRODUK, UPDATE_STOK_AIR_MINERAL } from "./fixtures";

const mocks = vi.hoisted(() => {
  const tx = {
    product: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    stockMovement: { create: vi.fn() },
  };
  return {
    tx,
    prisma: { $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)) },
  };
});
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/guards", () => ({
  requireUser: vi.fn(async () => ({ user: { id: "u-admin", role: "ADMIN" } })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { stockAdjust } from "@/actions/stock";

const { stockBefore, newStock, diff } = UPDATE_STOK_AIR_MINERAL;

function adjustError(input: Record<string, unknown>) {
  const res = stockAdjustSchema.safeParse({ productId: PRODUK.airMineral.id, ...input });
  return res.success ? null : res.error.issues[0].message;
}

describe("U6 - Update / penyesuaian stok", () => {
  it("U6-01 Air Mineral 150 → 200 menghasilkan selisih +50", () => {
    expect(calculateStockAdjustment(stockBefore, newStock)).toEqual({
      ok: true,
      stockBefore: 150,
      stockAfter: 200,
      quantity: diff,
    });
  });

  it("U6-02 penyesuaian turun 200 → 150 menghasilkan selisih -50", () => {
    expect(calculateStockAdjustment(200, 150)).toMatchObject({ ok: true, stockAfter: 150, quantity: -50 });
  });

  it("U6-03 [batas] stok baru 0 diterima (selisih -150)", () => {
    expect(calculateStockAdjustment(150, 0)).toMatchObject({ ok: true, stockAfter: 0, quantity: -150 });
    expect(adjustError({ newStock: 0, note: "Stock opname" })).toBeNull();
  });

  it("U6-04 [batas] stok baru sama dengan stok lama → selisih 0", () => {
    expect(calculateStockAdjustment(150, 150)).toMatchObject({ ok: true, quantity: 0 });
  });

  it("U6-05 [salah] stok baru -1 ditolak", () => {
    expect(calculateStockAdjustment(150, -1)).toEqual({ ok: false, message: "Stok baru tidak boleh negatif" });
    expect(adjustError({ newStock: -1, note: "Salah input" })).toBe("Stok baru tidak boleh negatif");
  });

  it("U6-06 [salah] alasan penyesuaian kosong / hanya spasi ditolak", () => {
    expect(adjustError({ newStock: 200, note: "" })).toBe("Alasan penyesuaian wajib diisi");
    expect(adjustError({ newStock: 200, note: "   " })).toBe("Alasan penyesuaian wajib diisi");
  });

  it("U6-07 [batas] alasan 200 karakter diterima, 201 karakter ditolak", () => {
    expect(adjustError({ newStock: 200, note: "a".repeat(200) })).toBeNull();
    expect(adjustError({ newStock: 200, note: "a".repeat(201) })).not.toBeNull();
  });

  it("U6-08 [salah] stok baru kosong (tidak diisi) ditolak", () => {
    expect(adjustError({ newStock: "", note: "Stock opname" })).not.toBeNull();
  });

  it("U6-09 stok masuk 150 + 50 = 200", () => {
    expect(calculateStockIn(150, 50)).toEqual({ ok: true, stockBefore: 150, stockAfter: 200, quantity: 50 });
  });

  it("U6-10 [batas] stok masuk 0 ditolak, stok masuk 1 diterima", () => {
    expect(calculateStockIn(150, 0).ok).toBe(false);
    expect(stockInSchema.safeParse({ productId: PRODUK.airMineral.id, quantity: 0 }).success).toBe(false);
    expect(stockInSchema.safeParse({ productId: PRODUK.airMineral.id, quantity: 1 }).success).toBe(true);
  });
});

describe("U6 - stockAdjust menyimpan riwayat (Prisma di-mock)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tx.product.findUniqueOrThrow.mockResolvedValue({ ...PRODUK.airMineral, stock: 150 });
  });

  it("U6-11 penyesuaian Air Mineral 150 → 200 mencatat ADJUSTMENT +50", async () => {
    const res = await stockAdjust({ productId: PRODUK.airMineral.id, newStock: "200", note: "Stock opname" });
    expect(res).toEqual({ ok: true, message: "Penyesuaian stok berhasil disimpan." });
    expect(mocks.tx.product.update).toHaveBeenCalledWith({
      where: { id: PRODUK.airMineral.id },
      data: { stock: 200 },
    });
    expect(mocks.tx.stockMovement.create.mock.calls[0][0].data).toMatchObject({
      type: "ADJUSTMENT",
      quantity: 50,
      stockBefore: 150,
      stockAfter: 200,
      note: "Stock opname",
      userId: "u-admin",
    });
  });

  it("U6-12 [salah] penyesuaian ke -1 ditolak tanpa menyentuh database", async () => {
    const res = await stockAdjust({ productId: PRODUK.airMineral.id, newStock: -1, note: "Salah input" });
    expect(res).toEqual({ ok: false, message: "Stok baru tidak boleh negatif" });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });
});
