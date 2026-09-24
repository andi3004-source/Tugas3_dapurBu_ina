import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  const [pendingCount, lowStockProducts, setting] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, stock: true, minStock: true },
    }),
    getSetting(),
  ]);

  const lowStock = lowStockProducts.filter((p) => p.stock <= p.minStock);

  const notifications = [
    ...lowStock.map((p) => ({
      id: `stock-${p.id}`,
      type: "stock" as const,
      title: p.stock === 0 ? `${p.name} habis` : `${p.name} menipis`,
      description: `Sisa stok: ${p.stock}`,
    })),
    ...(pendingCount > 0
      ? [
          {
            id: "pending-orders",
            type: "order" as const,
            title: `${pendingCount} pesanan menunggu pembayaran`,
            description: "Segera proses di menu Pesanan",
          },
        ]
      : []),
  ];

  const user = {
    name: session.user.name ?? session.user.username,
    username: session.user.username,
    role: session.user.role,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        role={user.role}
        pendingCount={pendingCount}
        lowStockCount={lowStock.length}
        brandName={setting.restaurantName}
        tagline={setting.tagline}
      />
      <div className="lg:pl-72">
        <Header
          user={user}
          notifications={notifications}
          pendingCount={pendingCount}
          lowStockCount={lowStock.length}
        />
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <MobileNav role={user.role} pendingCount={pendingCount} />
    </div>
  );
}
