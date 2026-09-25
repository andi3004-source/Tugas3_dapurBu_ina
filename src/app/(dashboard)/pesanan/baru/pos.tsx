"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart, Utensils, ShoppingBag } from "lucide-react";
import { createOrder } from "@/actions/orders";
import { calculateBilling } from "@/lib/billing";
import { formatRupiah, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

type Product = {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  imageUrl: string | null;
  categoryId: string;
};
type Category = { id: string; name: string };

export function Pos({
  products,
  categories,
  taxPercent,
  servicePercent,
}: {
  products: Product[];
  categories: Category[];
  taxPercent: number;
  servicePercent: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKE_AWAY">("DINE_IN");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function add(p: Product) {
    setCart((c) => {
      const cur = c[p.id] ?? 0;
      if (cur >= p.stock) return c;
      return { ...c, [p.id]: cur + 1 };
    });
  }
  function dec(id: string) {
    setCart((c) => {
      const cur = c[id] ?? 0;
      if (cur <= 1) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: cur - 1 };
    });
  }
  function removeItem(id: string) {
    setCart((c) => {
      const { [id]: _, ...rest } = c;
      return rest;
    });
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    product: productMap.get(id)!,
    qty,
  }));
  const {
    subtotal,
    tax,
    serviceCharge: service,
    total,
  } = calculateBilling(
    cartItems.map((it) => ({ price: it.product.price, quantity: it.qty })),
    taxPercent,
    servicePercent,
  );

  function submit() {
    if (cartItems.length === 0) {
      toast({ variant: "destructive", title: "Keranjang kosong", description: "Tambahkan minimal 1 item." });
      return;
    }
    if (orderType === "DINE_IN" && !tableNumber.trim()) {
      toast({ variant: "destructive", title: "Nomor meja kosong", description: "Isi nomor meja untuk Dine In." });
      return;
    }
    startTransition(async () => {
      const res = await createOrder({
        orderType,
        tableNumber,
        customerName,
        items: cartItems.map((it) => ({ productId: it.product.id, quantity: it.qty })),
      });
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Pesanan dibuat" : "Gagal",
        description: res.message,
      });
      if (res.ok && res.orderId) {
        router.push(`/pesanan/${res.orderId}/billing`);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Menu */}
      <div>
        <Tabs defaultValue="all">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">Semua</TabsTrigger>
            {categories.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <MenuGrid products={products} cart={cart} onAdd={add} />
          </TabsContent>
          {categories.map((c) => (
            <TabsContent key={c.id} value={c.id}>
              <MenuGrid
                products={products.filter((p) => p.categoryId === c.id)}
                cart={cart}
                onAdd={add}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Keranjang */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-navy">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="font-bold">Keranjang</h2>
              <Badge variant="muted" className="ml-auto">
                {cartItems.length} item
              </Badge>
            </div>

            {/* Tipe pesanan */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType("DINE_IN")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold",
                  orderType === "DINE_IN"
                    ? "border-primary bg-accent text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                <Utensils className="h-4 w-4" /> Dine In
              </button>
              <button
                type="button"
                onClick={() => setOrderType("TAKE_AWAY")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold",
                  orderType === "TAKE_AWAY"
                    ? "border-primary bg-accent text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                <ShoppingBag className="h-4 w-4" /> Take Away
              </button>
            </div>

            {orderType === "DINE_IN" ? (
              <div className="space-y-1.5">
                <Label>Nomor Meja *</Label>
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Contoh: 12"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Nama Pelanggan</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Rina"
                />
              </div>
            )}

            {/* Item list */}
            <div className="max-h-[280px] space-y-2 overflow-y-auto">
              {cartItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada item dipilih.
                </p>
              ) : (
                cartItems.map((it) => (
                  <div key={it.product.id} className="flex items-center gap-2 rounded-xl bg-muted/40 p-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">{it.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRupiah(it.product.price)} × {it.qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => dec(it.product.id)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{it.qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={it.qty >= it.product.stock}
                        onClick={() => add(it.product)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-brand-chili"
                        onClick={() => removeItem(it.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Ringkasan */}
            <div className="space-y-1.5 border-t border-border pt-3 text-sm">
              <Row label="Subtotal" value={formatRupiah(subtotal)} />
              <Row label={`Pajak (${taxPercent}%)`} value={formatRupiah(tax)} />
              <Row label={`Service (${servicePercent}%)`} value={formatRupiah(service)} />
              <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold text-navy">
                <span>Total</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" disabled={pending} onClick={submit}>
              {pending ? "Menyimpan..." : "Buat Pesanan & Lanjut Bayar"}
            </Button>
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

function MenuGrid({
  products,
  cart,
  onAdd,
}: {
  products: Product[];
  cart: Record<string, number>;
  onAdd: (p: Product) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {products.map((p) => {
        const habis = p.stock <= 0;
        const inCart = cart[p.id] ?? 0;
        return (
          <button
            key={p.id}
            disabled={habis}
            onClick={() => onAdd(p)}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-all",
              habis ? "cursor-not-allowed opacity-60" : "hover:border-primary hover:shadow-md",
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
            <div className="p-2.5">
              <p className="truncate text-sm font-semibold text-navy">{p.name}</p>
              <p className="text-xs text-muted-foreground">Stok: {p.stock}</p>
              <p className="mt-1 text-sm font-bold text-primary">{formatRupiah(p.price)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
