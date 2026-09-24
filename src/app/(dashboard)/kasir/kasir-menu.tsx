"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, Utensils, ShoppingBag, ArrowRight } from "lucide-react";
import { createOrder } from "@/actions/orders";
import { useCart, cartCount, cartSubtotal, type CartProduct } from "@/store/cart";
import { formatRupiah, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

type Product = CartProduct & { categoryId: string };
type Category = { id: string; name: string };

export function KasirMenu({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const cart = useCart();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  // Sinkronkan stok keranjang dengan data terbaru (auto-refresh 5 dtk)
  const stockSignature = products.map((p) => `${p.productId}:${p.stock}`).join(",");
  useEffect(() => {
    const byId: Record<string, number> = {};
    products.forEach((p) => (byId[p.productId] = p.stock));
    cart.syncStocks(byId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockSignature]);

  const filtered = useMemo(() => {
    let list = products;
    if (tab !== "all") list = list.filter((p) => p.categoryId === tab);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s),
      );
    }
    return list;
  }, [products, tab, q]);

  const qtyInCart = (id: string) => cart.items.find((i) => i.productId === id)?.qty ?? 0;

  function lanjut() {
    if (cart.items.length === 0) {
      toast({ variant: "destructive", title: "Keranjang kosong", description: "Pilih menu dulu." });
      return;
    }
    if (cart.orderType === "DINE_IN" && !cart.tableNumber.trim()) {
      toast({ variant: "destructive", title: "Meja belum dipilih", description: "Pilih nomor meja." });
      return;
    }

    startTransition(async () => {
      const res = await createOrder({
        orderType: cart.orderType,
        tableNumber: cart.tableNumber,
        customerName: cart.customerName,
        note: cart.note,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.qty,
        })),
      });

      if (!res.ok || !res.orderId) {
        toast({ variant: "destructive", title: "Gagal membuat pesanan", description: res.message });
        return;
      }

      cart.clear();
      router.push(`/kasir/pembayaran/${res.orderId}`);
    });
  }

  const subtotal = cartSubtotal(cart.items);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* Kiri: menu */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari menu berdasarkan nama atau kode..."
            className="pl-9"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">Semua</TabsTrigger>
            {categories.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((p) => {
            const habis = p.stock <= 0;
            const inCart = qtyInCart(p.productId);
            const atMax = inCart >= p.stock;
            return (
              <Card
                key={p.productId}
                className={cn(
                  "overflow-hidden",
                  habis && "opacity-60",
                )}
              >
                <div className="relative aspect-square w-full bg-muted">
                  {p.imageUrl && (
                    <Image src={p.imageUrl} alt={p.name} fill unoptimized className="object-cover" sizes="160px" />
                  )}
                  {habis && (
                    <span className="absolute inset-0 flex items-center justify-center bg-navy/50 text-sm font-bold text-white">
                      Habis
                    </span>
                  )}
                  {inCart > 0 && (
                    <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                      {inCart}
                    </span>
                  )}
                </div>
                <CardContent className="p-2.5">
                  <p className="truncate text-sm font-semibold text-navy">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Sisa stok: {p.stock}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">{formatRupiah(p.price)}</span>
                    <Button
                      size="icon"
                      className="h-8 w-8 rounded-full bg-brand-terracotta text-brand-cream hover:bg-brand-terracotta/90"
                      disabled={habis || atMax}
                      onClick={() => cart.addItem(p)}
                      aria-label={`Tambah ${p.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Tidak ada menu yang cocok.
          </p>
        )}
      </div>

      {/* Kanan: keranjang */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-navy">Keranjang Pesanan</h2>
              <Badge variant="muted">{cartCount(cart.items)} item</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cart.setOrderType("DINE_IN")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold",
                  cart.orderType === "DINE_IN"
                    ? "border-primary bg-accent text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                <Utensils className="h-4 w-4" /> Dine In
              </button>
              <button
                type="button"
                onClick={() => cart.setOrderType("TAKE_AWAY")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold",
                  cart.orderType === "TAKE_AWAY"
                    ? "border-primary bg-accent text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                <ShoppingBag className="h-4 w-4" /> Take Away
              </button>
            </div>

            {cart.orderType === "DINE_IN" ? (
              <div className="space-y-1.5">
                <Label>Nomor Meja</Label>
                <select
                  value={cart.tableNumber}
                  onChange={(e) => cart.setTableNumber(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Pilih meja...</option>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={String(n)}>
                      Meja {n}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Nama Pelanggan</Label>
                <Input
                  value={cart.customerName}
                  onChange={(e) => cart.setCustomerName(e.target.value)}
                  placeholder="Contoh: Rina"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Item Pesanan</span>
              {cart.items.length > 0 && (
                <button
                  onClick={() => cart.clear()}
                  className="text-xs font-semibold text-brand-chili hover:underline"
                >
                  Hapus Semua
                </button>
              )}
            </div>

            <div className="max-h-[240px] space-y-2 overflow-y-auto">
              {cart.items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Belum ada item dipilih.
                </p>
              ) : (
                cart.items.map((it) => (
                  <div key={it.productId} className="flex items-center gap-2 rounded-xl bg-muted/40 p-2">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-card">
                      {it.imageUrl && (
                        <Image src={it.imageUrl} alt={it.name} fill unoptimized className="object-cover" sizes="40px" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">{it.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.qty} × {formatRupiah(it.price)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-navy">
                      {formatRupiah(it.qty * it.price)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-brand-chili"
                      onClick={() => cart.removeItem(it.productId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Catatan Pesanan</Label>
              <Textarea
                value={cart.note}
                onChange={(e) => cart.setNote(e.target.value)}
                placeholder="Contoh: kurang pedas, tanpa bawang, dll"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-lg font-extrabold text-navy">{formatRupiah(subtotal)}</span>
            </div>

            <Button className="w-full" size="lg" onClick={lanjut} disabled={pending}>
              {pending ? "Membuat Pesanan..." : "Bayar"} {!pending && <ArrowRight className="h-4 w-4" />}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
