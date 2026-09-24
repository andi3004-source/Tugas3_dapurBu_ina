"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCashier } from "@/lib/guards";
import { paymentSchema } from "@/lib/validations";
import type { ActionResult } from "@/actions/products";

export async function confirmPayment(
  raw: unknown,
): Promise<ActionResult & { orderId?: string }> {
  const session = await requireCashier();
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: d.orderId },
        include: { payment: true },
      });
      if (order.status === "PAID" || order.payment) {
        throw new Error("Pesanan ini sudah dibayar.");
      }
      if (order.status === "CANCELLED") {
        throw new Error("Pesanan sudah dibatalkan.");
      }
      if (d.method === "CASH" && d.amountPaid < order.total) {
        throw new Error("Uang tunai kurang dari total tagihan.");
      }

      const amountPaid = d.method === "CASH" ? d.amountPaid : order.total;
      const change = d.method === "CASH" ? amountPaid - order.total : 0;

      await tx.payment.create({
        data: {
          orderId: order.id,
          method: d.method,
          amountPaid,
          change,
          referenceNo: d.referenceNo?.trim() || null,
          cardLast4: d.cardLast4?.trim() || null,
          confirmedById: session.user.id,
        },
      });

      await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });
    });

    revalidatePath("/kasir");
    revalidatePath("/pembayaran");
    revalidatePath("/pesanan");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    revalidatePath(`/pesanan/${d.orderId}/billing`);
    revalidatePath(`/kasir/pembayaran/${d.orderId}`);
    return { ok: true, message: "Pembayaran berhasil dikonfirmasi.", orderId: d.orderId };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Gagal memproses pembayaran." };
  }
}
