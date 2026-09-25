"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Trash2,
  Utensils,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Pencil,
  StickyNote,
} from "lucide-react";
import { useCart, cartSubtotal } from "@/store/cart";
import { createOrder } from "@/actions/orders";
import { calculateCharges } from "@/lib/billing";
import { formatRupiah, formatWaktu, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

export function KasirDetail({
  taxPercent,
  servicePercent,
  brandName = "Dapur Bu Aina",
}: {
  taxPercent: number;
  servicePercent: number;
  brandName?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const cart = useCart();
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  // Jika keranjang kosong (mis. reload setelah checkout), kembali ke menu.
  useEffect(() => {
    if (cart.hydrated && cart.items.length === 0) {
      router.replace("/kasir");
    }
  }, [cart.hydrated, cart.items.length, router]);

  if (!cart.hydrated) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Memuat keranjang...</p>;
  }
  if (cart.items.length === 0) return null;

  const isDineIn = cart.orderType === "DINE_IN";
  const subtotal = cartSubtotal(cart.items);
  const { tax, serviceCharge: service, total } = calculateCharges(subtotal, taxPercent, servicePercent);

  function checkout() {
    if (isDineIn && !cart.tableNumber.trim()) {
      toast({ variant: "destructive", title: "Meja belum dipilih", description: "Kembali dan pilih meja." });
      return;
    }
    startTransition(async () => {
      const res = await createOrder({
        orderType: cart.orderType,
        tableNumber: cart.tableNumber,
        customerName: cart.customerName,
        note: cart.note,
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.qty })),
      });
      if (res.ok && res.orderId) {
        cart.clear();
        router.push(`/kasir/pembayaran/${res.orderId}`);
      } else {
        toast({ variant: "destructive", title: "Gagal membuat pesanan", description: res.message });
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {/* Info meja */}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                {isDineIn ? <Utensils className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {isDineIn ? "Dine In" : "Take Away"}
                </p>
                <p className="font-bold text-navy">
                  {isDineIn
                    ? cart.tableNumber
                      ? `Meja ${cart.tableNumber}`
                      : "Meja belum dipilih"
                    : cart.customerName || "Umum"}
                </p>
              </div>
              <Badge variant={isDineIn ? "default" : "warning"}>
                {isDineIn ? "Dine In" : "Take Away"}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {now ? `${formatWaktu(now)} WIB` : "—"}
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push("/kasir")}>
                <Pencil className="h-4 w-4" /> Ubah Meja
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Daftar pesanan */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items.map((it, idx) => (
                  <TableRow key={it.productId}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {it.imageUrl && (
                            <Image src={it.imageUrl} alt={it.name} fill unoptimized className="object-cover" sizes="40px" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-navy">{it.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => cart.dec(it.productId)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-7 text-center text-sm font-semibold">{it.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={it.qty >= it.stock}
                          onClick={() => cart.inc(it.productId)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatRupiah(it.price)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-navy">
                      {formatRupiah(it.qty * it.price)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-brand-chili"
                        onClick={() => cart.removeItem(it.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {cart.note.trim() && (
              <div className="flex items-start gap-2 border-t border-border p-4 text-sm">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                <p className="text-muted-foreground">
                  <span className="font-semibold text-navy">Catatan:</span> {cart.note}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ringkasan */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-bold text-navy">Ringkasan Pesanan</h2>
            <div className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatRupiah(subtotal)} />
              <Row label={`Pajak (${taxPercent}%)`} value={formatRupiah(tax)} />
              {service > 0 && <Row label={`Service (${servicePercent}%)`} value={formatRupiah(service)} />}
              <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold text-navy">
                <span>Total</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={checkout} disabled={pending}>
              {pending ? "Memproses..." : "Lanjut ke Pembayaran"} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/kasir")} disabled={pending}>
              <ArrowLeft className="h-4 w-4" /> Kembali ke Menu
            </Button>

            <p className="pt-2 text-center font-hand text-lg text-brand-terracotta">
              Terima kasih sudah mempercayai {brandName} 🍲
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-navy">{value}</span>
    </div>
  );
}
