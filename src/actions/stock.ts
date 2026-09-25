"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guards";
import { stockInSchema, stockAdjustSchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/products";
import { calculateStockAdjustment, calculateStockIn } from "@/lib/stock";

/** Stok Masuk (IN) — menambah stok produk. */
export async function stockIn(raw: unknown): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = stockInSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { productId, quantity, note } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
      const change = calculateStockIn(product.stock, quantity);
      if (!change.ok) throw new Error(change.message);
      const { stockBefore, stockAfter } = change;

      await tx.product.update({ where: { id: productId }, data: { stock: stockAfter } });
      await tx.stockMovement.create({
        data: {
          productId,
          type: "IN",
          quantity,
          stockBefore,
          stockAfter,
          note: note || "Stok masuk",
          userId: session.user.id,
        },
      });
    });
  } catch {
    return { ok: false, message: "Gagal menyimpan stok masuk." };
  }

  revalidatePath("/stok");
  revalidatePath("/produk");
  revalidatePath("/dashboard");
  return { ok: true, message: "Stok masuk berhasil dicatat." };
}

/** Update / Penyesuaian stok (ADJUSTMENT) — set nilai stok baru. */
export async function stockAdjust(raw: unknown): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = stockAdjustSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { productId, newStock, note } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
      const change = calculateStockAdjustment(product.stock, newStock);
      if (!change.ok) throw new Error(change.message);
      const { stockBefore, quantity: diff } = change;

      await tx.product.update({ where: { id: productId }, data: { stock: newStock } });
      await tx.stockMovement.create({
        data: {
          productId,
          type: "ADJUSTMENT",
          quantity: diff,
          stockBefore,
          stockAfter: newStock,
          note,
          userId: session.user.id,
        },
      });
    });
  } catch {
    return { ok: false, message: "Gagal menyimpan penyesuaian stok." };
  }

  revalidatePath("/stok");
  revalidatePath("/produk");
  revalidatePath("/dashboard");
  return { ok: true, message: "Penyesuaian stok berhasil disimpan." };
}
