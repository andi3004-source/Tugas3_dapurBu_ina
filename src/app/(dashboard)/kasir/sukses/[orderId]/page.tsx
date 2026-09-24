import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireCashier } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatTanggalWaktu } from "@/lib/utils";
import { paymentMethodLabel, orderTypeLabel } from "@/lib/format-labels";
import { Card, CardContent } from "@/components/ui/card";
import { Confetti } from "@/components/confetti";
import { ReceiptLogo } from "@/components/receipt-logo";
import { SuccessActions } from "./success-actions";

export const dynamic = "force-dynamic";

export default async function KasirSuksesPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireCashier();
  const { orderId } = await params;

  const [order, setting] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true, cashier: true },
    }),
    prisma.setting.findFirst(),
  ]);

  if (!order) notFound();
  if (order.status !== "PAID" || !order.payment) redirect(`/kasir/pembayaran/${orderId}`);

  const p = order.payment;
  const restaurant = {
    name: setting?.restaurantName ?? "Dapur Bu Aina",
    tagline: setting?.tagline ?? "Citarasa Warisan Keluarga",
    address: setting?.address ?? "-",
    phone: setting?.phone ?? "-",
  };
  const isDineIn = order.orderType === "DINE_IN";
  const tableLabel = isDineIn
    ? `Meja ${order.tableNumber}`
    : `${orderTypeLabel[order.orderType]}${order.customerName ? ` · ${order.customerName}` : ""}`;

  return (
    <div className="relative">
      <Confetti />
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kiri: konfirmasi */}
        <div className="flex flex-col items-center justify-center gap-4 text-center no-print">
          <div className="animate-pop-in flex h-24 w-24 items-center justify-center rounded-full bg-brand-leaf/15 text-brand-leaf">
            <CheckCircle2 className="h-14 w-14" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-navy">Transaksi Berhasil!</h1>
            <p className="mt-1 font-hand text-xl text-brand-terracotta">
              Terima kasih telah berkunjung di {restaurant.name}
            </p>
          </div>

          <Card className="w-full max-w-sm text-left">
            <CardContent className="space-y-2 p-5 text-sm">
              <Info label="No. Transaksi" value={order.orderNumber} mono />
              <Info label="Meja / Tipe" value={tableLabel} />
              <Info label="Total Pembayaran" value={formatRupiah(order.total)} strong />
              <Info label="Metode" value={paymentMethodLabel[p.method]} />
              {p.method === "CASH" && (
                <>
                  <Info label="Tunai" value={formatRupiah(p.amountPaid)} />
                  <Info label="Kembalian" value={formatRupiah(p.change)} />
                </>
              )}
              {p.referenceNo && <Info label="Referensi" value={p.referenceNo} />}
              <Info label="Waktu" value={formatTanggalWaktu(order.createdAt)} />
            </CardContent>
          </Card>

          <div className="w-full max-w-sm">
            <SuccessActions />
          </div>
        </div>

        {/* Kanan: preview struk */}
        <div className="flex justify-center">
          <Card className="w-full max-w-[340px]">
            <CardContent className="p-6">
              <div className="print-area">
                <div className="flex flex-col items-center text-center">
                  <ReceiptLogo />
                  <p className="mt-2 font-serif font-bold text-navy">{restaurant.name}</p>
                  <p className="text-[10px] italic text-muted-foreground">{restaurant.tagline}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{restaurant.address}</p>
                  <p className="text-[10px] text-muted-foreground">{restaurant.phone}</p>
                </div>

                <div className="my-3 border-t border-dashed border-border" />
                <p className="text-center text-sm font-bold tracking-wide text-navy">
                  STRUK PEMBAYARAN
                </p>
                <div className="my-3 border-t border-dashed border-border" />

                <div className="space-y-0.5 text-xs">
                  <Line label="No. Transaksi" value={order.orderNumber} />
                  <Line label={isDineIn ? "Meja" : "Tipe"} value={isDineIn ? String(order.tableNumber) : tableLabel} />
                  <Line label="Kasir" value={order.cashier.name} />
                  <Line label="Tanggal" value={formatTanggalWaktu(order.createdAt)} />
                </div>

                <div className="my-3 border-t border-dashed border-border" />

                <div className="space-y-1 text-xs">
                  {order.items.map((it) => (
                    <div key={it.id}>
                      <div className="flex justify-between">
                        <span className="text-navy">{it.productName}</span>
                        <span className="font-medium text-navy">{formatRupiah(it.subtotal)}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {it.quantity} × {formatRupiah(it.price)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-3 border-t border-dashed border-border" />

                <div className="space-y-0.5 text-xs">
                  <Line label="Subtotal" value={formatRupiah(order.subtotal)} />
                  <Line label={`Pajak (${setting?.taxPercent ?? 10}%)`} value={formatRupiah(order.tax)} />
                  {order.serviceCharge > 0 && (
                    <Line label={`Service (${setting?.servicePercent ?? 5}%)`} value={formatRupiah(order.serviceCharge)} />
                  )}
                  <div className="flex justify-between border-t border-border pt-1 text-sm font-extrabold text-navy">
                    <span>TOTAL</span>
                    <span>{formatRupiah(order.total)}</span>
                  </div>
                </div>

                <div className="my-3 border-t border-dashed border-border" />

                <div className="space-y-0.5 text-xs">
                  <Line label="Metode" value={paymentMethodLabel[p.method]} />
                  {p.method === "CASH" ? (
                    <>
                      <Line label="Tunai" value={formatRupiah(p.amountPaid)} />
                      <Line label="Kembalian" value={formatRupiah(p.change)} />
                    </>
                  ) : (
                    p.referenceNo && <Line label="Referensi" value={p.referenceNo} />
                  )}
                  {p.cardLast4 && <Line label="Kartu" value={`**** ${p.cardLast4}`} />}
                </div>

                <div className="my-3 border-t border-dashed border-border" />
                <p className="text-center text-[11px] font-semibold text-navy">
                  Terima Kasih, Sampai Jumpa Lagi
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  mono,
  strong,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={[
          "text-navy",
          mono ? "font-mono" : "",
          strong ? "font-extrabold" : "font-medium",
        ].join(" ")}
      >
        {value}
      </span>
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
