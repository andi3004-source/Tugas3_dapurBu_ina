import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateOrderStock } from "@/lib/stock";
import { orderSchema } from "@/lib/validations";
import { PRODUK, productMap } from "./fixtures";

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

const menu = productMap(PRODUK.esJeruk, PRODUK.jusAlpukat, PRODUK.airMineral, PRODUK.menuLama);

describe("U5 - Validasi stok pesanan", () => {
  it("U5-01 pesan 2 Es Jeruk dari stok 8 diterima", () => {
    expect(validateOrderStock([{ productId: PRODUK.esJeruk.id, quantity: 2 }], menu)).toBeNull();
  });

  it("U5-02 [batas] qty sama dengan stok (8 Es Jeruk dari stok 8) diterima", () => {
    expect(validateOrderStock([{ productId: PRODUK.esJeruk.id, quantity: 8 }], menu)).toBeNull();
  });

  it("U5-03 [batas] qty stok + 1 (9 Es Jeruk dari stok 8) ditolak", () => {
    expect(validateOrderStock([{ productId: PRODUK.esJeruk.id, quantity: 9 }], menu)).toBe(
      "Stok Es Jeruk tidak cukup (sisa 8).",
    );
  });

  it("U5-04 [salah] pesan Jus Alpukat yang stoknya 0 ditolak", () => {
    expect(validateOrderStock([{ productId: PRODUK.jusAlpukat.id, quantity: 1 }], menu)).toBe(
      "Stok Jus Alpukat tidak cukup (sisa 0).",
    );
  });

  it("U5-05 [batas] qty 0 ditolak oleh skema pesanan dan fungsi validasi", () => {
    const res = orderSchema.safeParse({
      orderType: "TAKE_AWAY",
      items: [{ productId: PRODUK.airMineral.id, quantity: 0 }],
    });
    expect(res.success).toBe(false);
    expect(validateOrderStock([{ productId: PRODUK.airMineral.id, quantity: 0 }], menu)).toBe(
      "Jumlah Air Mineral harus lebih dari 0.",
    );
  });

  it("U5-06 [salah] qty negatif (-1) ditolak oleh skema pesanan", () => {
    const res = orderSchema.safeParse({
      orderType: "TAKE_AWAY",
      items: [{ productId: PRODUK.airMineral.id, quantity: -1 }],
    });
    expect(res.success).toBe(false);
  });

  it("U5-07 [salah] pesanan tanpa item ditolak dengan pesan 'Minimal 1 item'", () => {
    const res = orderSchema.safeParse({ orderType: "TAKE_AWAY", items: [] });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.issues[0].message).toBe("Minimal 1 item");
  });

  it("U5-08 [salah] produk yang tidak ada / nonaktif ditolak", () => {
    expect(validateOrderStock([{ productId: "p-tidak-ada", quantity: 1 }], menu)).toBe("Produk tidak ditemukan.");
    expect(validateOrderStock([{ productId: PRODUK.menuLama.id, quantity: 1 }], menu)).toBe("Menu Lama tidak aktif.");
  });

  it("U5-09 banyak item: satu item kurang stok membuat seluruh pesanan ditolak", () => {
    const err = validateOrderStock(
      [
        { productId: PRODUK.airMineral.id, quantity: 5 },
        { productId: PRODUK.esJeruk.id, quantity: 10 },
      ],
      menu,
    );
    expect(err).toBe("Stok Es Jeruk tidak cukup (sisa 8).");
  });
});

describe("U5 - createOrder menolak stok kurang (Prisma di-mock)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.setting.findFirst.mockResolvedValue({ taxPercent: 10, servicePercent: 5 });
    mocks.tx.product.findMany.mockResolvedValue([{ ...PRODUK.esJeruk }]);
  });

  it("U5-10 [salah] pesan 9 Es Jeruk (stok 8) → gagal, stok & pesanan tidak diubah", async () => {
    const res = await createOrder({
      orderType: "TAKE_AWAY",
      customerName: "Sari",
      items: [{ productId: PRODUK.esJeruk.id, quantity: 9 }],
    });
    expect(res).toEqual({ ok: false, message: "Stok Es Jeruk tidak cukup (sisa 8)." });
    expect(mocks.tx.product.updateMany).not.toHaveBeenCalled();
    expect(mocks.tx.order.create).not.toHaveBeenCalled();
  });

  it("U5-11 [salah] stok habis karena pesanan lain (race) → updateMany 0 baris, pesanan ditolak", async () => {
    mocks.tx.order.count.mockResolvedValue(0);
    mocks.tx.product.updateMany.mockResolvedValue({ count: 0 });
    mocks.tx.product.findUnique.mockResolvedValue({ name: "Es Jeruk", stock: 1 });
    const res = await createOrder({
      orderType: "TAKE_AWAY",
      items: [{ productId: PRODUK.esJeruk.id, quantity: 2 }],
    });
    expect(res).toEqual({ ok: false, message: "Stok Es Jeruk tidak cukup, sisa 1." });
    expect(mocks.tx.order.create).not.toHaveBeenCalled();
  });
});
