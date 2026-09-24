"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCashier, requireUser } from "@/lib/guards";
import { orderSchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/products";

/**
 * Nomor transaksi format #TRX-YYYYMMDD-XXXX, urutan direset per hari.
 */
async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const ymd = `${y}${m}${d}`;

  const dayStart = new Date(y, now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(y, now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const countToday = await tx.order.count({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
  });
  const seq = String(countToday + 1).padStart(4, "0");
  return `#TRX-${ymd}-${seq}`;
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

      for (const item of d.items) {
        const p = map.get(item.productId);
        if (!p) throw new Error("Produk tidak ditemukan.");
        if (!p.isActive) throw new Error(`${p.name} tidak aktif.`);
        if (p.stock < item.quantity) {
          throw new Error(`Stok ${p.name} tidak cukup (sisa ${p.stock}).`);
        }
      }

      const orderItems = d.items.map((item) => {
        const p = map.get(item.productId)!;
        return {
          productId: p.id,
          productName: p.name,
          price: p.price,
          quantity: item.quantity,
          subtotal: p.price * item.quantity,
        };
      });

      const subtotal = orderItems.reduce((s, it) => s + it.subtotal, 0);
      const tax = Math.round((subtotal * taxPct) / 100);
      const serviceCharge = Math.round((subtotal * svcPct) / 100);
      const total = subtotal + tax + serviceCharge;

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
