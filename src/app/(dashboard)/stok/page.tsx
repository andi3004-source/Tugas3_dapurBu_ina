import { PlusCircle, SlidersHorizontal, History, ArrowDownCircle, ArrowUpCircle, RefreshCcw } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getStockStatus, formatTanggalWaktu } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockStatusBadge } from "@/components/status-badges";
import { AutoRefresh } from "@/components/auto-refresh";
import { StockFilters } from "./stock-filters";
import { StockDialog } from "./stock-dialog";
import { HistoryFilter } from "./history-filter";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  kategori?: string;
  status?: string;
  tab?: string;
  dari?: string;
  sampai?: string;
};

const MOVE_LABEL: Record<string, string> = {
  IN: "Masuk",
  OUT: "Keluar",
  ADJUSTMENT: "Penyesuaian",
};

export default async function StokPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await requireUser();
  const sp = await searchParams;
  const isAdmin = session.user.role === "ADMIN";

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (sp.kategori && sp.kategori !== "all") where.categoryId = sp.kategori;
  if (sp.q) {
    where.OR = [
      { name: { contains: sp.q, mode: "insensitive" } },
      { code: { contains: sp.q, mode: "insensitive" } },
    ];
  }

  const [allProducts, categories] = await Promise.all([
    prisma.product.findMany({ where, include: { category: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Filter status stok di sisi aplikasi (karena bergantung stock vs minStock)
  const products = allProducts.filter((p) => {
    if (!sp.status || sp.status === "all") return true;
    return getStockStatus(p.stock, p.minStock) === sp.status;
  });

  const productOptions = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    stock: p.stock,
    unit: p.unit,
    code: p.code,
  }));

  // Riwayat stok
  const moveWhere: Prisma.StockMovementWhereInput = {};
  if (sp.dari || sp.sampai) {
    moveWhere.createdAt = {};
    if (sp.dari) (moveWhere.createdAt as Prisma.DateTimeFilter).gte = new Date(`${sp.dari}T00:00:00`);
    if (sp.sampai) (moveWhere.createdAt as Prisma.DateTimeFilter).lte = new Date(`${sp.sampai}T23:59:59`);
  }
  const movements = await prisma.stockMovement.findMany({
    where: moveWhere,
    include: { product: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <AutoRefresh interval={5000} />
      <PageHeader
        title="Stok Barang"
        description="Kelola stok makanan & minuman berdasarkan kriteria."
      >
        {isAdmin && (
          <>
            <StockDialog
              mode="IN"
              products={productOptions}
              trigger={
                <Button variant="outline">
                  <PlusCircle className="h-4 w-4" /> Input Stok Masuk
                </Button>
              }
            />
            <StockDialog
              mode="ADJUST"
              products={productOptions}
              trigger={
                <Button>
                  <SlidersHorizontal className="h-4 w-4" /> Update Stok
                </Button>
              }
            />
          </>
        )}
      </PageHeader>

      <Tabs defaultValue={sp.tab === "riwayat" ? "riwayat" : "kelola"}>
        <TabsList>
          <TabsTrigger value="kelola">Daftar Stok</TabsTrigger>
          <TabsTrigger value="riwayat">
            <History className="mr-1.5 h-4 w-4" /> Riwayat Stok
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kelola" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter Berdasarkan Kriteria</CardTitle>
              <CardDescription>
                Saring produk menurut kategori, status stok, atau kata kunci.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockFilters categories={categories} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Min</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs font-semibold text-navy">{p.code}</TableCell>
                      <TableCell className="text-sm font-semibold text-navy">{p.name}</TableCell>
                      <TableCell>
                        <Badge variant="muted">{p.category.name}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-navy">
                        {p.stock} <span className="text-xs font-normal text-muted-foreground">{p.unit}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.minStock}</TableCell>
                      <TableCell>
                        <StockStatusBadge stock={p.stock} minStock={p.minStock} />
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <StockDialog
                              mode="IN"
                              products={productOptions}
                              presetProductId={p.id}
                              trigger={
                                <Button variant="ghost" size="sm" className="text-brand-leaf hover:bg-brand-leaf/10">
                                  <ArrowDownCircle className="h-4 w-4" /> Masuk
                                </Button>
                              }
                            />
                            <StockDialog
                              mode="ADJUST"
                              products={productOptions}
                              presetProductId={p.id}
                              trigger={
                                <Button variant="ghost" size="sm" className="text-primary hover:bg-accent">
                                  <RefreshCcw className="h-4 w-4" /> Sesuaikan
                                </Button>
                              }
                            />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {products.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Tidak ada produk yang cocok dengan kriteria.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Perubahan Stok</CardTitle>
              <CardDescription>Setiap perubahan stok tercatat otomatis.</CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryFilter />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Perubahan</TableHead>
                    <TableHead>Sebelum → Sesudah</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead>Oleh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatTanggalWaktu(m.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-navy">{m.product.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={m.type === "IN" ? "success" : m.type === "OUT" ? "danger" : "default"}
                        >
                          {MOVE_LABEL[m.type]}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={
                          m.quantity >= 0 ? "font-semibold text-brand-leaf" : "font-semibold text-brand-chili"
                        }
                      >
                        {m.quantity >= 0 ? "+" : ""}
                        {m.quantity}
                      </TableCell>
                      <TableCell className="text-sm">
                        {m.stockBefore} → <span className="font-semibold">{m.stockAfter}</span>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                        {m.note ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.user?.name ?? "Sistem"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {movements.length === 0 && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Belum ada riwayat pada rentang tanggal ini.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
