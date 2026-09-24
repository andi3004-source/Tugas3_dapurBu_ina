import Link from "next/link";
import { Plus, Receipt, Eye } from "lucide-react";
import type { Prisma, OrderStatus } from "@prisma/client";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggalWaktu } from "@/lib/utils";
import { orderTypeLabel, paymentMethodLabel } from "@/lib/format-labels";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/status-badges";
import { AutoRefresh } from "@/components/auto-refresh";
import { OrderFilters } from "./order-filters";
import { CancelOrder } from "./cancel-order";

export const dynamic = "force-dynamic";

type SP = { status?: string; tanggal?: string };

export default async function PesananPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  const where: Prisma.OrderWhereInput = {};
  if (sp.status && sp.status !== "all") where.status = sp.status as OrderStatus;
  if (sp.tanggal) {
    const start = new Date(`${sp.tanggal}T00:00:00`);
    const end = new Date(`${sp.tanggal}T23:59:59`);
    where.createdAt = { gte: start, lte: end };
  }

  const orders = await prisma.order.findMany({
    where,
    include: { payment: true, cashier: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <AutoRefresh interval={5000} />
      <PageHeader title="Pesanan" description="Kelola seluruh pesanan pelanggan.">
        {session.user.role === "KASIR" && (
          <Button asChild>
            <Link href="/kasir">
              <Plus className="h-4 w-4" /> Buat Pesanan
            </Link>
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <OrderFilters />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pesanan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-semibold text-navy">
                    {o.orderNumber}
                  </TableCell>
                  <TableCell className="text-sm">
                    {o.orderType === "DINE_IN"
                      ? `Meja ${o.tableNumber}`
                      : `${orderTypeLabel[o.orderType]}${o.customerName ? ` · ${o.customerName}` : ""}`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o._count.items} item</TableCell>
                  <TableCell className="font-semibold">{formatRupiah(o.total)}</TableCell>
                  <TableCell className="text-xs">
                    {o.payment ? (
                      <Badge variant="muted">{paymentMethodLabel[o.payment.method]}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatTanggalWaktu(o.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {o.status === "PENDING" && session.user.role === "KASIR" && (
                        <>
                          <Button asChild variant="ghost" size="sm" className="text-primary hover:bg-accent">
                            <Link href={`/pesanan/${o.id}/billing`}>
                              <Receipt className="h-4 w-4" /> Bayar
                            </Link>
                          </Button>
                          <CancelOrder id={o.id} orderNumber={o.orderNumber} />
                        </>
                      )}
                      {o.status === "PAID" && (
                        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                          <Link href={`/pesanan/${o.id}/billing`}>
                            <Eye className="h-4 w-4" /> Struk
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {orders.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Tidak ada pesanan dengan filter ini.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
