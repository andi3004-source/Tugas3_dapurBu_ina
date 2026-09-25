"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCashier, requireUser } from "@/lib/guards";
import { orderSchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/products";
import { calculateBilling, lineSubtotal } from "@/lib/billing";
import { formatOrderNumber, orderDayRange } from "@/lib/order-number";
import { validateOrderStock } from "@/lib/stock";

/**
 * Nomor transaksi format #TRX-YYYYMMDD-XXXX, urutan direset per hari.
 */
async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const { start, end } = orderDayRange(now);
  const countToday = await tx.order.count({
    where: { createdAt: { gte: start, lte: end } },
  });
  return formatOrderNumber(now, countToday);
}

export async function createOrder(
  raw: unknown,
): Promise<ActionResult & { orderId?: string }> {
  const session = await requireCashier();
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;

  if (d.orderType === "DINE_IN" && !d.tableNumber?.trim()) {
    return { ok: false, message: "Nomor meja wajib diisi untuk Dine In." };
  }

  const setting = await prisma.setting.findFirst();
  const taxPct = setting?.taxPercent ?? 10;
  const svcPct = setting?.servicePercent ?? 5;

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      // Validasi stok terkini
      const productIds = d.items.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const map = new Map(products.map((p) => [p.id, p]));

      const stockError = validateOrderStock(d.items, map);
      if (stockError) throw new Error(stockError);

      const orderItems = d.items.map((item) => {
        const p = map.get(item.productId)!;
        return {
          productId: p.id,
          productName: p.name,
          price: p.price,
          quantity: item.quantity,
          subtotal: lineSubtotal(p.price, item.quantity),
        };
      });

      const { subtotal, tax, serviceCharge, total } = calculateBilling(
        orderItems.map((it) => ({ price: it.price, quantity: it.quantity })),
        taxPct,
        svcPct,
      );

      const orderNumber = await nextOrderNumber(tx);

      // Kurangi stok secara aman dari race condition:
      // updateMany bersyarat stock >= qty; jika 0 baris ter-update → stok tak cukup.
      for (const item of d.items) {
        const p = map.get(item.productId)!;
        const res = await tx.product.updateMany({
          where: { id: p.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (res.count === 0) {
          const fresh = await tx.product.findUnique({
            where: { id: p.id },
            select: { stock: true, name: true },
          });
          throw new Error(
            `Stok ${fresh?.name ?? p.name} tidak cukup, sisa ${fresh?.stock ?? 0}.`,
          );
        }
        await tx.stockMovement.create({
          data: {
            productId: p.id,
            type: "OUT",
            quantity: -item.quantity,
            stockBefore: p.stock,
            stockAfter: p.stock - item.quantity,
            note: `Pesanan ${orderNumber}`,
            userId: session.user.id,
          },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          orderType: d.orderType,
          tableNumber: d.orderType === "DINE_IN" ? d.tableNumber?.trim() : null,
          customerName: d.orderType === "TAKE_AWAY" ? d.customerName?.trim() || "Umum" : null,
          note: d.note?.trim() || null,
          status: "PENDING",
          subtotal,
          tax,
          serviceCharge,
          total,
          cashierId: session.user.id,
          items: { create: orderItems },
        },
      });

      return order.id;
    });

    revalidatePath("/kasir");
    revalidatePath("/pesanan");
    revalidatePath("/pembayaran");
    revalidatePath("/stok");
    revalidatePath("/dashboard");
    return { ok: true, message: "Pesanan berhasil dibuat.", orderId };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Gagal membuat pesanan.",
    };
  }
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const session = await requireUser();
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: true },
      });
      if (order.status !== "PENDING") {
        throw new Error("Hanya pesanan menunggu yang bisa dibatalkan.");
      }

      // Kembalikan stok
      for (const item of order.items) {
        const p = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        const stockAfter = p.stock + item.quantity;
        await tx.product.update({ where: { id: p.id }, data: { stock: stockAfter } });
        await tx.stockMovement.create({
          data: {
            productId: p.id,
            type: "IN",
            quantity: item.quantity,
            stockBefore: p.stock,
            stockAfter,
            note: `Pembatalan ${order.orderNumber}`,
            userId: session.user.id,
          },
        });
      }

      await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    });

    revalidatePath("/kasir");
    revalidatePath("/pesanan");
    revalidatePath("/pembayaran");
    revalidatePath("/stok");
    revalidatePath("/dashboard");
    return { ok: true, message: "Pesanan dibatalkan & stok dikembalikan." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Gagal membatalkan." };
  }
}
