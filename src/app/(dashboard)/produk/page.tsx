import Image from "next/image";
import { Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockStatusBadge } from "@/components/status-badges";
import { ProductDialog } from "./product-dialog";
import { DeleteProduct } from "./delete-product";

export const dynamic = "force-dynamic";

export default async function ProdukPage() {
  await requireAdmin();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { code: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Produk" description="Kelola daftar menu makanan & minuman restoran.">
        <ProductDialog categories={categories} />
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs font-semibold text-navy">{p.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {p.imageUrl && (
                          <Image src={p.imageUrl} alt={p.name} fill unoptimized className="object-cover" sizes="40px" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy">{p.name}</p>
                        <p className="text-xs text-muted-foreground">per {p.unit}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="muted">{p.category.name}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{formatRupiah(p.price)}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-navy">{p.stock}</span>
                    <span className="text-xs text-muted-foreground"> / min {p.minStock}</span>
                  </TableCell>
                  <TableCell>
                    <StockStatusBadge stock={p.stock} minStock={p.minStock} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <ProductDialog
                        categories={categories}
                        product={{
                          id: p.id,
                          code: p.code,
                          name: p.name,
                          categoryId: p.categoryId,
                          price: p.price,
                          stock: p.stock,
                          minStock: p.minStock,
                          unit: p.unit,
                          imageUrl: p.imageUrl,
                        }}
                        trigger={
                          <Button variant="ghost" size="icon" className="text-primary hover:bg-accent">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DeleteProduct id={p.id} name={p.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {products.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Belum ada produk. Tambahkan produk pertama Anda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
