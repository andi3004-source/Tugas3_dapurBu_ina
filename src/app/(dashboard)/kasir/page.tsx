import { requireCashier } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { AutoRefresh } from "@/components/auto-refresh";
import { KasirMenu } from "./kasir-menu";

export const dynamic = "force-dynamic";

export default async function KasirPage() {
  await requireCashier();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <AutoRefresh interval={5000} />
      <PageHeader
        title="Kasir"
        description="Pilih menu untuk membuat pesanan pelanggan."
      />
      <KasirMenu
        products={products.map((p) => ({
          productId: p.id,
          code: p.code,
          name: p.name,
          price: p.price,
          unit: p.unit,
          imageUrl: p.imageUrl,
          stock: p.stock,
          categoryId: p.categoryId,
        }))}
        categories={categories}
      />
    </div>
  );
}
