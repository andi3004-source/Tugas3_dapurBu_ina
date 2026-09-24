import Link from "next/link";
import Image from "next/image";
import { Package, Receipt, SearchX } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggalWaktu } from "@/lib/utils";
import { orderTypeLabel } from "@/lib/format-labels";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockStatusBadge, OrderStatusBadge } from "@/components/status-badges";

export const dynamic = "force-dynamic";

export default async function PencarianPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { q = "" } = await searchParams;
  const term = q.trim();

  const [products, orders] = term
    ? await Promise.all([
        prisma.product.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { code: { contains: term, mode: "insensitive" } },
            ],
          },
          include: { category: true },
          take: 20,
        }),
        prisma.order.findMany({
          where: {
            OR: [
              { orderNumber: { contains: term, mode: "insensitive" } },
              { customerName: { contains: term, mode: "insensitive" } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ])
    : [[], []];

  const empty = products.length === 0 && orders.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hasil Pencarian"
        description={term ? `Menampilkan hasil untuk “${term}”` : "Ketik kata kunci di kolom pencarian."}
      />

      {term && empty && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-navy">Tidak ada hasil</p>
            <p className="text-sm text-muted-foreground">
              Coba kata kunci lain seperti nama produk atau nomor pesanan.
            </p>
          </CardContent>
        </Card>
      )}

      {products.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle>Produk ({products.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill unoptimized className="object-cover" sizes="48px" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.category.name} · {formatRupiah(p.price)}
                  </p>
                </div>
                <StockStatusBadge stock={p.stock} minStock={p.minStock} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {orders.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <CardTitle>Pesanan ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/pesanan/${o.id}/billing`}
                className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-primary"
              >
                <div>
                  <p className="font-mono text-sm font-bold text-navy">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.orderType === "DINE_IN" ? `Meja ${o.tableNumber}` : orderTypeLabel[o.orderType]} ·{" "}
                    {formatTanggalWaktu(o.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-navy">{formatRupiah(o.total)}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
