import { prisma } from "@/lib/prisma";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const yesterdayStart = addDays(todayStart, -1);

  const paidWhere = { status: "PAID" as const };

  const [todayOrders, yesterdayOrders, products, recentOrders] = await Promise.all([
    prisma.order.findMany({
      where: { ...paidWhere, createdAt: { gte: todayStart, lt: tomorrowStart } },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: { ...paidWhere, createdAt: { gte: yesterdayStart, lt: todayStart } },
      select: { total: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { stock: "asc" },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { payment: true },
    }),
  ]);

  const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
  const yesterdaySales = yesterdayOrders.reduce((s, o) => s + o.total, 0);
  const todayCount = todayOrders.length;
  const yesterdayCount = yesterdayOrders.length;
  const todayAvg = todayCount ? Math.round(todaySales / todayCount) : 0;
  const yesterdayAvg = yesterdayCount ? Math.round(yesterdaySales / yesterdayCount) : 0;

  // 7 hari terakhir
  const weekStart = addDays(todayStart, -6);
  const weekOrders = await prisma.order.findMany({
    where: { ...paidWhere, createdAt: { gte: weekStart, lt: tomorrowStart } },
    select: { total: true, createdAt: true },
  });

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const day = addDays(weekStart, i);
    const next = addDays(day, 1);
    const inDay = weekOrders.filter((o) => o.createdAt >= day && o.createdAt < next);
    return {
      label: DAY_NAMES[day.getDay()],
      date: `${day.getDate()}/${day.getMonth() + 1}`,
      sales: inDay.reduce((s, o) => s + o.total, 0),
      orders: inDay.length,
    };
  });

  // Stok perlu perhatian
  const lowStock = products.filter((p) => p.stock <= p.minStock);

  // Penjualan per kategori hari ini
  const todayItems = await prisma.orderItem.findMany({
    where: {
      order: { ...paidWhere, createdAt: { gte: todayStart, lt: tomorrowStart } },
    },
    include: { product: { include: { category: true } } },
  });

  const catMap = new Map<string, number>();
  for (const it of todayItems) {
    const cat = it.product.category.name;
    catMap.set(cat, (catMap.get(cat) ?? 0) + it.subtotal);
  }
  const catTotal = [...catMap.values()].reduce((s, v) => s + v, 0);
  const salesByCategory = ["Makanan Utama", "Appetizer", "Minuman"].map((name) => {
    const total = catMap.get(name) ?? 0;
    return {
      name,
      total,
      percent: catTotal ? Math.round((total / catTotal) * 100) : 0,
    };
  });

  return {
    stats: {
      todaySales,
      yesterdaySales,
      todayCount,
      yesterdayCount,
      todayAvg,
      yesterdayAvg,
      lowStockCount: lowStock.length,
    },
    last7Days,
    lowStock: lowStock.slice(0, 5),
    lowStockTotal: lowStock.length,
    recentOrders,
    salesByCategory,
    catTotal,
  };
}
