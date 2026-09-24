import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [pendingCount, products] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { stock: true, minStock: true },
    }),
  ]);

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return NextResponse.json({
    pendingCount,
    lowStockCount,
    notifCount: pendingCount + lowStockCount,
    lastUpdated: new Date().toISOString(),
  });
}
