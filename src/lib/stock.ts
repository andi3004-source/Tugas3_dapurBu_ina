export type StockStatus = "AMAN" | "HAMPIR_HABIS" | "HABIS";

/** Status stok: Habis bila ≤ 0, Hampir Habis bila ≤ stok minimum, selain itu Aman. */
export function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return "HABIS";
  if (stock <= minStock) return "HAMPIR_HABIS";
  return "AMAN";
}

export const stockStatusLabel: Record<StockStatus, string> = {
  AMAN: "Aman",
  HAMPIR_HABIS: "Hampir Habis",
  HABIS: "Habis",
};

export type OrderLine = { productId: string; quantity: number };
export type StockProduct = { id: string; name: string; stock: number; isActive: boolean };

/**
 * Validasi stok untuk pesanan. Mengembalikan pesan kesalahan pertama,
 * atau null bila semua item bisa dipenuhi.
 */
export function validateOrderStock(
  items: OrderLine[],
  products: Map<string, StockProduct>,
): string | null {
  for (const item of items) {
    const p = products.get(item.productId);
    if (!p) return "Produk tidak ditemukan.";
    if (!p.isActive) return `${p.name} tidak aktif.`;
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return `Jumlah ${p.name} harus lebih dari 0.`;
    }
    if (p.stock < item.quantity) {
      return `Stok ${p.name} tidak cukup (sisa ${p.stock}).`;
    }
  }
  return null;
}

export type StockChange =
  | { ok: true; stockBefore: number; stockAfter: number; quantity: number }
  | { ok: false; message: string };

/** Stok masuk: stok bertambah sebanyak quantity (> 0). */
export function calculateStockIn(stockBefore: number, quantity: number): StockChange {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, message: "Jumlah harus lebih dari 0" };
  }
  return { ok: true, stockBefore, stockAfter: stockBefore + quantity, quantity };
}

/** Penyesuaian stok: set stok baru (≥ 0); quantity = selisih terhadap stok lama. */
export function calculateStockAdjustment(stockBefore: number, newStock: number): StockChange {
  if (!Number.isInteger(newStock) || newStock < 0) {
    return { ok: false, message: "Stok baru tidak boleh negatif" };
  }
  return { ok: true, stockBefore, stockAfter: newStock, quantity: newStock - stockBefore };
}
