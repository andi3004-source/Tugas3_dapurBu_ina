import Link from "next/link";
import { Receipt, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { requireCashier } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggalWaktu } from "@/lib/utils";
import { orderTypeLabel, paymentMethodLabel } from "@/lib/format-labels";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function PembayaranPage() {
  await requireCashier();

  const [pending, recentPaid] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PENDING" },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { status: "PAID" },
      include: { payment: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembayaran"
        description="Proses billing dan pembayaran pesanan pelanggan."
      />

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Clock className="h-5 w-5 text-brand-gold" />
          <CardTitle>Menunggu Pembayaran ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Tidak ada pesanan yang menunggu pembayaran. 🎉
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pending.map((o) => (
                <div key={o.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-navy">{o.orderNumber}</span>
                    <Badge variant="warning">Menunggu</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {o.orderType === "DINE_IN"
                      ? `Meja ${o.tableNumber}`
                      : `${orderTypeLabel[o.orderType]}${o.customerName ? ` · ${o.customerName}` : ""}`}
                    {" · "}
                    {o._count.items} item
                  </p>
                  <p className="mt-2 text-xl font-extrabold text-navy">{formatRupiah(o.total)}</p>
                  <p className="text-xs text-muted-foreground">{formatTanggalWaktu(o.createdAt)}</p>
                  <Button asChild className="mt-3 w-full">
                    <Link href={`/pesanan/${o.id}/billing`}>
                      <Receipt className="h-4 w-4" /> Proses Pembayaran
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-brand-leaf" />
          <CardTitle>Pembayaran Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pesanan</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPaid.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs font-semibold text-navy">
                    {o.orderNumber}
                  </TableCell>
                  <TableCell className="font-semibold">{formatRupiah(o.total)}</TableCell>
                  <TableCell>
                    {o.payment && <Badge variant="muted">{paymentMethodLabel[o.payment.method]}</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatTanggalWaktu(o.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm" className="text-primary">
                      <Link href={`/pesanan/${o.id}/billing`}>
                        Lihat Struk <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {recentPaid.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada pembayaran.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
