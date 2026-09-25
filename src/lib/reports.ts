import { prisma } from "@/lib/prisma";
import { paymentMethodLabel } from "@/lib/format-labels";
import type { PaymentMethod } from "@prisma/client";
import { buildDailyTrend, periodToRange, summarizeRevenue, type Period } from "@/lib/period";

export type { Period } from "@/lib/period";
export { isoWeekToRange, monthToRange, periodToRange } from "@/lib/period";

export async function getReport(period: Period) {
  const { start, end, label } = periodToRange(period);

  const orders = await prisma.order.findMany({
    where: { status: "PAID", createdAt: { gte: start, lte: end } },
    include: {
      payment: true,
      items: { include: { product: { include: { category: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const { totalRevenue, totalTx, avgTx } = summarizeRevenue(orders);

  // Tren harian
  const trend = buildDailyTrend(orders);

  // Per kategori
  const catMap = new Map<string, number>();
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    for (const it of o.items) {
      const cat = it.product.category.name;
      catMap.set(cat, (catMap.get(cat) ?? 0) + it.subtotal);
      const pm = productMap.get(it.productId) ?? { name: it.productName, qty: 0, revenue: 0 };
      pm.qty += it.quantity;
      pm.revenue += it.subtotal;
      productMap.set(it.productId, pm);
    }
  }
  const byCategory = ["Makanan Utama", "Appetizer", "Minuman"].map((name) => ({
    name,
    total: catMap.get(name) ?? 0,
  }));

  // Per metode
  const methodMap = new Map<PaymentMethod, { count: number; total: number }>();
  for (const o of orders) {
    if (!o.payment) continue;
    const cur = methodMap.get(o.payment.method) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total += o.total;
    methodMap.set(o.payment.method, cur);
  }
  const byMethod = (["CASH", "DEBIT", "CREDIT_CARD", "QRIS"] as PaymentMethod[]).map((m) => ({
    method: m,
    label: paymentMethodLabel[m],
    count: methodMap.get(m)?.count ?? 0,
    total: methodMap.get(m)?.total ?? 0,
  }));

  // Produk terlaris
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return {
    label,
    start,
    end,
    summary: { totalRevenue, totalTx, avgTx, topProduct: topProducts[0]?.name ?? "-" },
    trend,
    byCategory,
    byMethod,
    topProducts,
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      type: o.orderType,
      table: o.tableNumber,
      customer: o.customerName,
      method: o.payment?.method ?? null,
      total: o.total,
    })),
  };
}
