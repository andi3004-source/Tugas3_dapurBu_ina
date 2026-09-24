"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, QrCode, Wallet, CheckCircle2 } from "lucide-react";
import type { PaymentMethod } from "@prisma/client";
import { confirmPayment } from "@/actions/payments";
import { formatRupiah, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

const METHODS: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { key: "CASH", label: "Tunai", icon: <Banknote className="h-5 w-5" /> },
  { key: "DEBIT", label: "Kartu Debit", icon: <CreditCard className="h-5 w-5" /> },
  { key: "CREDIT_CARD", label: "Kartu Kredit", icon: <CreditCard className="h-5 w-5" /> },
  { key: "QRIS", label: "QRIS", icon: <QrCode className="h-5 w-5" /> },
];

export function PaymentPanel({ orderId, total }: { orderId: string; total: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [cash, setCash] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const cashNum = Number(cash) || 0;
  const change = cashNum - total;
  const cashEnough = cashNum >= total;

  const quickAmounts = [total, 50000, 100000, 150000].filter((v, i, a) => a.indexOf(v) === i);

  function validate(): string | null {
    if (method === "CASH" && !cashEnough) return "Uang tunai kurang dari total.";
    if ((method === "DEBIT" || method === "CREDIT_CARD") && !/^\d{4}$/.test(cardLast4))
      return "Masukkan 4 digit terakhir kartu.";
    if (method === "QRIS" && !referenceNo.trim()) return "Masukkan nomor referensi QRIS.";
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
        orderId,
        method,
        amountPaid: method === "CASH" ? cashNum : total,
        cardLast4: cardLast4 || undefined,
        referenceNo: referenceNo || undefined,
      });
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Pembayaran berhasil" : "Gagal",
        description: res.message,
      });
      if (res.ok) {
        setConfirmOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center gap-2 text-navy">
          <Wallet className="h-5 w-5" />
          <h2 className="font-bold">Pembayaran</h2>
        </div>

        <div className="rounded-xl bg-accent p-4 text-center">
          <p className="text-xs text-primary">Total Tagihan</p>
          <p className="text-2xl font-extrabold text-primary">{formatRupiah(total)}</p>
        </div>

        {/* Pilih metode */}
        <div>
          <Label className="mb-2 block">Metode Pembayaran</Label>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMethod(m.key)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold",
                  method === m.key
                    ? "border-primary bg-accent text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detail per metode */}
        {method === "CASH" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Uang Diterima</Label>
              <Input
                type="number"
                min={0}
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCash(String(total))}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:bg-muted"
              >
                Uang Pas
              </button>
              {quickAmounts
                .filter((v) => v !== total)
                .map((v) => (
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
              <span className="font-extrabold">
                {cashEnough ? formatRupiah(change) : "Uang kurang"}
              </span>
            </div>
          </div>
        )}

        {(method === "DEBIT" || method === "CREDIT_CARD") && (
          <div className="space-y-3">
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
              <Label>Nomor Approval / Referensi (opsional)</Label>
              <Input
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Contoh: 001234"
              />
            </div>
          </div>
        )}

        {method === "QRIS" && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="rounded-xl border border-border bg-card p-3">
                <QrDummy />
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Pindai QR untuk membayar {formatRupiah(total)}
            </p>
            <div className="space-y-1.5">
              <Label>Nomor Referensi</Label>
              <Input
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Contoh: QR20260923001"
              />
            </div>
          </div>
        )}

        <Button className="w-full" size="lg" onClick={openConfirm} disabled={pending}>
          <CheckCircle2 className="h-4 w-4" /> Konfirmasi Pembayaran
        </Button>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            <DialogDescription>
              Konfirmasi pembayaran sebesar{" "}
              <span className="font-bold text-navy">{formatRupiah(total)}</span> dengan
              metode{" "}
              <span className="font-bold text-navy">
                {METHODS.find((m) => m.key === method)?.label}
              </span>
              ?
              {method === "CASH" && cashEnough && (
                <span className="mt-1 block">
                  Kembalian: <span className="font-bold text-navy">{formatRupiah(change)}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button onClick={doPay} disabled={pending}>
              {pending ? "Memproses..." : "Ya, Bayar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function QrDummy() {
  // QR palsu deterministik untuk tampilan (bukan QR asli)
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21;
    const y = Math.floor(i / 21);
    const finder =
      (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    return finder ? (x === 0 || x === 6 || y === 0 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5) ? 1 : 0) : (x * 3 + y * 7 + x * y) % 3 === 0 ? 1 : 0;
  });
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "repeat(21, 6px)", gridTemplateRows: "repeat(21, 6px)" }}
    >
      {cells.map((c, i) => (
        <div key={i} style={{ background: c ? "#1E2A5A" : "transparent" }} />
      ))}
    </div>
  );
}
