import { notFound, redirect } from "next/navigation";
import { requireCashier } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { KasirPayment } from "./kasir-payment";

export const dynamic = "force-dynamic";

export default async function KasirPembayaranPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireCashier();
  const { orderId } = await params;

  const [order, setting] = await Promise.all([
    prisma.order.findUnique({ where: { id: orderId }, include: { items: true } }),
    prisma.setting.findFirst(),
  ]);

  if (!order) notFound();
  if (order.status === "PAID") redirect(`/kasir/sukses/${order.id}`);
  if (order.status === "CANCELLED") redirect("/kasir");

  return (
    <div className="space-y-6">
      <PageHeader title="Pembayaran" description={`Transaksi ${order.orderNumber}`} />
      <KasirPayment
        taxPercent={setting?.taxPercent ?? 10}
        servicePercent={setting?.servicePercent ?? 5}
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          tableNumber: order.tableNumber,
          customerName: order.customerName,
          createdAt: order.createdAt.toISOString(),
          subtotal: order.subtotal,
          tax: order.tax,
          serviceCharge: order.serviceCharge,
          total: order.total,
          items: order.items.map((it) => ({
            id: it.id,
            productName: it.productName,
            quantity: it.quantity,
            price: it.price,
            subtotal: it.subtotal,
          })),
        }}
      />
    </div>
  );
}
