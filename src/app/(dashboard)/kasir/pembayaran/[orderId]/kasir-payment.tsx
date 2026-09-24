"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle2,
  ArrowLeft,
  Info,
  Wallet,
} from "lucide-react";
import type { PaymentMethod } from "@prisma/client";
import { confirmPayment } from "@/actions/payments";
import { cancelOrder } from "@/actions/orders";
import { formatRupiah, formatWaktu, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { QrDummy } from "@/components/qr-dummy";
import { useToast } from "@/components/ui/use-toast";

type Item = { id: string; productName: string; quantity: number; price: number; subtotal: number };
type Order = {
  id: string;
  orderNumber: string;
  orderType: "DINE_IN" | "TAKE_AWAY";
  tableNumber: string | null;
  customerName: string | null;
  createdAt: string;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  items: Item[];
};

type Choice = "CASH" | "QRIS" | "CARD";

export function KasirPayment({
  order,
  taxPercent,
  servicePercent,
}: {
  order: Order;
  taxPercent: number;
  servicePercent: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [cancelling, startCancel] = useTransition();

  const [choice, setChoice] = useState<Choice>("CASH");
  const [cardType, setCardType] = useState<"DEBIT" | "CREDIT_CARD">("DEBIT");
  const [cash, setCash] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const total = order.total;
  const cashNum = Number(cash) || 0;
  const change = cashNum - total;
  const cashEnough = cashNum >= total;

  const method: PaymentMethod = choice === "CASH" ? "CASH" : choice === "QRIS" ? "QRIS" : cardType;
  const methodLabel =
    choice === "CASH" ? "Tunai" : choice === "QRIS" ? "QRIS" : cardType === "DEBIT" ? "Kartu Debit" : "Kartu Kredit";

  const isDineIn = order.orderType === "DINE_IN";

  function validate(): string | null {
    if (choice === "CASH" && !cashEnough) return "Nominal tunai kurang dari total.";
    if (choice === "CARD" && !/^\d{4}$/.test(cardLast4)) return "Masukkan 4 digit terakhir kartu.";
    if (choice === "QRIS" && !referenceNo.trim()) return "Masukkan nomor referensi QRIS.";
    return null;
  }

  function openConfirm() {
    const err = validate();
    if (err) {
      toast({ variant: "destructive", title: "Belum lengkap", description: err });
      return;
    }
    setConfirmOpen(true);
  }

  function doPay() {
    startTransition(async () => {
      const res = await confirmPayment({
        orderId: order.id,
        method,
        amountPaid: choice === "CASH" ? cashNum : total,
        cardLast4: choice === "CARD" ? cardLast4 : undefined,
        referenceNo: choice !== "CASH" ? referenceNo || undefined : undefined,
      });
      if (res.ok) {
        setConfirmOpen(false);
        router.push(`/kasir/sukses/${order.id}`);
      } else {
        toast({ variant: "destructive", title: "Gagal", description: res.message });
        setConfirmOpen(false);
      }
    });
  }

  function batal() {
    startCancel(async () => {
      const res = await cancelOrder(order.id);
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Pesanan dibatalkan" : "Gagal",
        description: res.message,
      });
      if (res.ok) router.push("/kasir");
    });
  }

  const quick = [50000, 100000, 150000, 200000];

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr_300px]">
      {/* Kiri: ringkasan dari DB */}
      <Card className="lg:sticky lg:top-20 lg:self-start">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-navy">Ringkasan Pesanan</h2>
            <Badge variant={isDineIn ? "default" : "warning"}>
              {isDineIn ? "Dine In" : "Take Away"}
            </Badge>
          </div>
          <div className="space-y-0.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">No. Transaksi</span>
              <span className="font-mono font-semibold text-navy">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isDineIn ? "Meja" : "Pelanggan"}</span>
              <span className="text-navy">
                {isDineIn ? `Meja ${order.tableNumber}` : order.customerName || "Umum"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Waktu</span>
              <span className="text-navy">{formatWaktu(new Date(order.createdAt))} WIB</span>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-border pt-3">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span className="text-navy">
                  {it.productName} <span className="text-muted-foreground">×{it.quantity}</span>
                </span>
                <span className="font-medium text-navy">{formatRupiah(it.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="text-navy">{formatRupiah(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Pajak ({taxPercent}%)</span>
              <span className="text-navy">{formatRupiah(order.tax)}</span>
            </div>
            {order.serviceCharge > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Service ({servicePercent}%)</span>
                <span className="text-navy">{formatRupiah(order.serviceCharge)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold text-navy">
              <span>Total</span>
              <span>{formatRupiah(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tengah: metode */}
      <Card>
        <CardContent className="space-y-5 p-5">
          <h2 className="font-bold text-navy">Metode Pembayaran</h2>

          <div className="grid gap-2 sm:grid-cols-3">
            <MethodCard active={choice === "CASH"} onClick={() => setChoice("CASH")} icon={<Banknote className="h-5 w-5" />} label="Tunai" />
            <MethodCard active={choice === "QRIS"} onClick={() => setChoice("QRIS")} icon={<QrCode className="h-5 w-5" />} label="QRIS" />
            <MethodCard active={choice === "CARD"} onClick={() => setChoice("CARD")} icon={<CreditCard className="h-5 w-5" />} label="Debit / Kredit" />
          </div>

          {choice === "CASH" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nominal Uang Diterima</Label>
                <Input type="number" min={0} value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCash(String(total))}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:bg-muted"
                >
                  Uang Pas
                </button>
                {quick.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCash(String(v))}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:bg-muted"
                  >
                    {formatRupiah(v)}
                  </button>
                ))}
              </div>
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl p-3 text-sm",
                  cashEnough ? "bg-brand-leaf/10 text-[#4f6a2f]" : "bg-brand-chili/10 text-brand-chili",
                )}
              >
                <span className="font-medium">Kembalian</span>
                <span className="text-lg font-extrabold">
                  {cashEnough ? formatRupiah(change) : "Uang kurang"}
                </span>
              </div>
            </div>
          )}

          {choice === "QRIS" && (
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="rounded-xl border border-border bg-card p-3">
                  <QrDummy />
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Pindai untuk membayar {formatRupiah(total)}
              </p>
              <div className="space-y-1.5">
                <Label>Nomor Referensi</Label>
                <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Contoh: QR20260923001" />
              </div>
            </div>
          )}

          {choice === "CARD" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCardType("DEBIT")}
                  className={cn(
                    "rounded-xl border py-2 text-sm font-semibold",
                    cardType === "DEBIT" ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  Kartu Debit
                </button>
                <button
                  type="button"
                  onClick={() => setCardType("CREDIT_CARD")}
                  className={cn(
                    "rounded-xl border py-2 text-sm font-semibold",
                    cardType === "CREDIT_CARD" ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  Kartu Kredit
                </button>
              </div>
              <div className="space-y-1.5">
                <Label>4 Digit Terakhir Kartu</Label>
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="1234"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nomor Approval / Referensi</Label>
                <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Contoh: 001234" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={batal} disabled={cancelling || pending} className="sm:w-auto">
              <ArrowLeft className="h-4 w-4" /> {cancelling ? "Membatalkan..." : "Batalkan Pesanan"}
            </Button>
            <Button className="flex-1" size="lg" onClick={openConfirm} disabled={pending}>
              <CheckCircle2 className="h-4 w-4" /> Proses Pembayaran
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kanan: petunjuk */}
      <Card className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
        <CardContent className="space-y-4 p-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
            {choice === "CASH" ? <Wallet className="h-8 w-8" /> : choice === "QRIS" ? <QrCode className="h-8 w-8" /> : <CreditCard className="h-8 w-8" />}
          </div>
          <p className="font-bold text-navy">{methodLabel}</p>
          <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-left text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              {choice === "CASH" && "Masukkan nominal uang yang diterima, sistem menghitung kembalian otomatis."}
              {choice === "QRIS" && "Minta pelanggan memindai QR, lalu masukkan nomor referensi setelah pembayaran berhasil."}
              {choice === "CARD" && "Gesek/tap kartu pada mesin EDC, masukkan 4 digit terakhir kartu dan nomor approval."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            <DialogDescription>
              Proses pembayaran <span className="font-bold text-navy">{formatRupiah(total)}</span> dengan{" "}
              <span className="font-bold text-navy">{methodLabel}</span>?
              {choice === "CASH" && cashEnough && (
                <span className="mt-1 block">
                  Kembalian: <span className="font-bold text-navy">{formatRupiah(change)}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button onClick={doPay} disabled={pending}>
              {pending ? "Memproses..." : "Ya, Bayar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MethodCard({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition-colors",
        active ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-muted/50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
