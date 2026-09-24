import { requireCashier } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Pos } from "./pos";

export const dynamic = "force-dynamic";

export default async function PesananBaruPage() {
  await requireCashier();

  const [products, categories, setting] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.setting.findFirst(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Pesanan"
        description="Pilih menu, tentukan tipe pesanan, lalu lanjut ke pembayaran."
      />
      <Pos
        products={products.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          price: p.price,
          stock: p.stock,
          unit: p.unit,
          imageUrl: p.imageUrl,
          categoryId: p.categoryId,
        }))}
        categories={categories}
        taxPercent={setting?.taxPercent ?? 10}
        servicePercent={setting?.servicePercent ?? 5}
      />
    </div>
  );
}
