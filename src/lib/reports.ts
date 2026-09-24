import { prisma } from "@/lib/prisma";
import { paymentMethodLabel } from "@/lib/format-labels";
import type { PaymentMethod } from "@prisma/client";

export type Period =
  | { type: "weekly"; value: string } // "2026-W39"
  | { type: "monthly"; value: string }; // "2026-09"

/** Ubah ISO week string "2026-W39" menjadi rentang Senin–Minggu. */
export function isoWeekToRange(value: string): { start: Date; end: Date; label: string } {
  const m = value.match(/^(\d{4})-W(\d{2})$/);
  const now = new Date();
  const year = m ? Number(m[1]) : now.getFullYear();
  const week = m ? Number(m[2]) : 1;

  // Kamis minggu pertama menentukan tahun ISO
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const monday = new Date(simple);
  if (dow <= 4) monday.setDate(simple.getDate() - simple.getDay() + 1);
  else monday.setDate(simple.getDate() + 8 - simple.getDay());
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday, label: `Minggu ke-${week}, ${year}` };
}

export function monthToRange(value: string): { start: Date; end: Date; label: string } {
  const m = value.match(/^(\d{4})-(\d{2})$/);
  const now = new Date();
  const year = m ? Number(m[1]) : now.getFullYear();
  const month = m ? Number(m[2]) - 1 : now.getMonth();
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const label = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(start);
  return { start, end, label };
}

export function periodToRange(period: Period) {
  return period.type === "weekly" ? isoWeekToRange(period.value) : monthToRange(period.value);
}

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

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalTx = orders.length;
  const avgTx = totalTx ? Math.round(totalRevenue / totalTx) : 0;

  // Tren harian
  const trendMap = new Map<string, { sales: number; orders: number }>();
  for (const o of orders) {
    const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}-${String(o.createdAt.getDate()).padStart(2, "0")}`;
    const cur = trendMap.get(key) ?? { sales: 0, orders: 0 };
    cur.sales += o.total;
    cur.orders += 1;
    trendMap.set(key, cur);
  }
  const trend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      label: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(
        new Date(date),
      ),
      ...v,
    }));

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
