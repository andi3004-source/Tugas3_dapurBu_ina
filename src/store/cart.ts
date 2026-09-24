"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartProduct = {
  productId: string;
  code: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string | null;
  stock: number;
};

export type CartItem = CartProduct & { qty: number };

export type OrderType = "DINE_IN" | "TAKE_AWAY";

type CartState = {
  items: CartItem[];
  orderType: OrderType;
  tableNumber: string;
  customerName: string;
  note: string;
  hydrated: boolean;
  // actions
  addItem: (p: CartProduct) => void;
  setQty: (productId: string, qty: number) => void;
  inc: (productId: string) => void;
  dec: (productId: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  syncStocks: (stockById: Record<string, number>) => void;
  setOrderType: (t: OrderType) => void;
  setTableNumber: (v: string) => void;
  setCustomerName: (v: string) => void;
  setNote: (v: string) => void;
  setHydrated: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: "DINE_IN",
      tableNumber: "",
      customerName: "",
      note: "",
      hydrated: false,

      addItem: (p) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === p.productId);
        if (existing) {
          if (existing.qty >= p.stock) return;
          set({
            items: items.map((i) =>
              i.productId === p.productId ? { ...i, qty: i.qty + 1, stock: p.stock } : i,
            ),
          });
        } else {
          if (p.stock <= 0) return;
          set({ items: [...items, { ...p, qty: 1 }] });
        }
      },

      setQty: (productId, qty) => {
        set({
          items: get()
            .items.map((i) =>
              i.productId === productId
                ? { ...i, qty: Math.max(0, Math.min(qty, i.stock)) }
                : i,
            )
            .filter((i) => i.qty > 0),
        });
      },

      inc: (productId) => {
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.qty < i.stock ? { ...i, qty: i.qty + 1 } : i,
          ),
        });
      },

      dec: (productId) => {
        set({
          items: get()
            .items.map((i) => (i.productId === productId ? { ...i, qty: i.qty - 1 } : i))
            .filter((i) => i.qty > 0),
        });
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      // Selaraskan stok item keranjang dengan data terbaru dari server;
      // pangkas qty bila melebihi stok terkini.
      syncStocks: (stockById) => {
        set({
          items: get()
            .items.map((i) => {
              const s = stockById[i.productId];
              if (s === undefined) return i;
              return { ...i, stock: s, qty: Math.min(i.qty, s) };
            })
            .filter((i) => i.qty > 0),
        });
      },

      clear: () =>
        set({ items: [], note: "", tableNumber: "", customerName: "" }),

      setOrderType: (orderType) => set({ orderType }),
      setTableNumber: (tableNumber) => set({ tableNumber }),
      setCustomerName: (customerName) => set({ customerName }),
      setNote: (note) => set({ note }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "dapur-kasir-cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.sessionStorage : undefined!,
      ),
      partialize: (s) => ({
        items: s.items,
        orderType: s.orderType,
        tableNumber: s.tableNumber,
        customerName: s.customerName,
        note: s.note,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.qty, 0);
}
export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.qty * i.price, 0);
}
