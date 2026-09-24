"use client";

import { Utensils, ShoppingBag } from "lucide-react";
import { useCart, cartCount } from "@/store/cart";
import { Badge } from "@/components/ui/badge";

export function ActiveTableCard() {
  const { items, orderType, tableNumber, customerName, hydrated } = useCart();

  if (!hydrated || items.length === 0) return null;

  const isDineIn = orderType === "DINE_IN";
  const label = isDineIn
    ? tableNumber
      ? `Meja ${tableNumber}`
      : "Meja belum dipilih"
    : customerName
      ? customerName
      : "Take Away";

  return (
    <div className="rounded-xl border border-primary/30 bg-accent p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-primary">Meja Aktif</span>
        <Badge variant={isDineIn ? "default" : "warning"}>
          {isDineIn ? (
            <span className="flex items-center gap-1">
              <Utensils className="h-3 w-3" /> Dine In
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" /> Take Away
            </span>
          )}
        </Badge>
      </div>
      <p className="text-sm font-bold text-navy">{label}</p>
      <p className="text-xs text-muted-foreground">
        {cartCount(items)} item dalam keranjang
      </p>
    </div>
  );
}
