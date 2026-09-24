import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, MapPin, Phone } from "lucide-react";
import { requireUser, requireCashier } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggalWaktu } from "@/lib/utils";
import { orderTypeLabel, paymentMethodLabel } from "@/lib/format-labels";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentPanel } from "./payment-panel";
import { PrintButton } from "@/components/print-button";
import { ReceiptLogo } from "@/components/receipt-logo";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  const [order, setting] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: true, cashier: true, payment: { include: { confirmedBy: true } } },
    }),
    prisma.setting.findFirst(),
  ]);

  if (!order) notFound();

  // Admin tetap dapat melihat struk lunas, tetapi tidak dapat membuka billing
  // pesanan yang masih menunggu pembayaran.
  if (order.status === "PENDING" && session.user.role !== "KASIR") {
    await requireCashier();
  }

  const paid = order.status === "PAID";
  const restaurant = {
    name: setting?.restaurantName ?? "Dapur Bu Aina",
    tagline: setting?.tagline ?? "Citarasa Warisan Keluarga",
    address: setting?.address ?? "-",
    phone: setting?.phone ?? "-",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <Button asChild variant="ghost" size="sm">
          <Link href="/pesanan">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </Button>
        {paid && <PrintButton />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Billing / Struk */}
        <Card>
          <CardContent className="p-6">
            <div className="print-area">
              <div className="flex flex-col items-center text-center">
                <ReceiptLogo />
                <h2 className="mt-2 font-serif text-xl font-bold text-navy">{restaurant.name}</h2>
                <p className="text-[11px] italic text-muted-foreground">{restaurant.tagline}</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {restaurant.address}
                </p>
                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" /> {restaurant.phone}
                </p>
              </div>

              <div className="my-4 border-t border-dashed border-border" />

              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">No. Pesanan</span>
                <span className="text-right font-mono font-semibold text-navy">{order.orderNumber}</span>
                <span className="text-muted-foreground">Tanggal</span>
                <span className="text-right text-navy">{formatTanggalWaktu(order.createdAt)}</span>
                <span className="text-muted-foreground">Kasir</span>
                <span className="text-right text-navy">{order.cashier.name}</span>
                <span className="text-muted-foreground">Tipe</span>
                <span className="text-right text-navy">
                  {order.orderType === "DINE_IN"
                    ? `Dine In · Meja ${order.tableNumber}`
                    : `${orderTypeLabel[order.orderType]}${order.customerName ? ` · ${order.customerName}` : ""}`}
                </span>
              </div>

              <div className="my-4 border-t border-dashed border-border" />

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Item</th>
                    <th className="pb-2 text-center font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Harga</th>
                    <th className="pb-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id} className="align-top">
                      <td className="py-1 text-navy">{it.productName}</td>
                      <td className="py-1 text-center">{it.quantity}</td>
                      <td className="py-1 text-right text-muted-foreground">{formatRupiah(it.price)}</td>
                      <td className="py-1 text-right font-medium text-navy">{formatRupiah(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="my-4 border-t border-dashed border-border" />

              <div className="space-y-1 text-sm">
                <Line label="Subtotal" value={formatRupiah(order.subtotal)} />
                <Line label={`Pajak (${setting?.taxPercent ?? 10}%)`} value={formatRupiah(order.tax)} />
                <Line label={`Service (${setting?.servicePercent ?? 5}%)`} value={formatRupiah(order.serviceCharge)} />
                <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-extrabold text-navy">
                  <span>TOTAL</span>
                  <span>{formatRupiah(order.total)}</span>
                </div>
              </div>

              {paid && order.payment && (
                <>
                  <div className="my-4 border-t border-dashed border-border" />
                  <div className="space-y-1 text-sm">
                    <Line label="Metode" value={paymentMethodLabel[order.payment.method]} />
                    <Line label="Dibayar" value={formatRupiah(order.payment.amountPaid)} />
                    {order.payment.method === "CASH" && (
                      <Line label="Kembalian" value={formatRupiah(order.payment.change)} />
                    )}
                    {order.payment.cardLast4 && (
                      <Line label="Kartu" value={`**** ${order.payment.cardLast4}`} />
                    )}
                    {order.payment.referenceNo && (
                      <Line label="Ref" value={order.payment.referenceNo} />
                    )}
                  </div>
                  <div className="mt-5 text-center">
                    <span className="inline-block rounded-lg border-2 border-emerald-500 px-4 py-1 text-sm font-extrabold uppercase tracking-wide text-brand-leaf">
                      Lunas
                    </span>
                  </div>
                </>
              )}

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Terima kasih atas kunjungan Anda 🙏
              </p>
              <p className="text-center text-[10px] text-muted-foreground">
                {restaurant.tagline}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Panel kanan */}
        <div className="no-print">
          {paid ? (
            <Card>
              <CardContent className="space-y-4 p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-leaf/15 text-brand-leaf">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-navy">Pembayaran Lunas</h2>
                  <p className="text-sm text-muted-foreground">
                    Pesanan {order.orderNumber} telah dibayar penuh.
                  </p>
                </div>
                <Badge variant="success" className="mx-auto">
                  {paymentMethodLabel[order.payment!.method]}
                </Badge>
                <PrintButton className="w-full" />
                {session.user.role === "KASIR" && (
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/pesanan/baru">Buat Pesanan Baru</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : order.status === "CANCELLED" ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Pesanan ini telah dibatalkan.
              </CardContent>
            </Card>
          ) : (
            <PaymentPanel orderId={order.id} total={order.total} />
          )}
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-navy">{value}</span>
    </div>
  );
}
