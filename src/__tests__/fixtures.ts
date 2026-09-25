/**
 * Data uji unit test Dapur Bu Aina.
 * Nilai diambil dari data aplikasi (prisma/seed.ts & pengaturan default)
 * supaya mudah dicocokkan dengan laporan sesi 3.
 */
import type { StockProduct } from "@/lib/stock";

// ── Pengaturan restoran (default) ────────────────────────────────────────────
export const TAX_PERCENT = 10;
export const SERVICE_PERCENT = 5;

// ── Produk ───────────────────────────────────────────────────────────────────
export const PRODUK = {
  ayamBakarMadu: { id: "p-mu-001", code: "MU-001", name: "Ayam Bakar Madu", price: 32000, stock: 40, minStock: 10, isActive: true },
  airMineral: { id: "p-mn-005", code: "MN-005", name: "Air Mineral", price: 5000, stock: 200, minStock: 30, isActive: true },
  esJeruk: { id: "p-mn-002", code: "MN-002", name: "Es Jeruk", price: 8000, stock: 8, minStock: 20, isActive: true },
  jusAlpukat: { id: "p-mn-004", code: "MN-004", name: "Jus Alpukat", price: 20000, stock: 0, minStock: 10, isActive: true },
  // Produk nonaktif (dihapus/soft delete) untuk negative test
  menuLama: { id: "p-old-001", code: "OLD-001", name: "Menu Lama", price: 15000, stock: 10, minStock: 5, isActive: false },
} as const;

export function productMap(...items: StockProduct[]): Map<string, StockProduct> {
  return new Map(items.map((p) => [p.id, p]));
}

// ── Billing Meja 12 ──────────────────────────────────────────────────────────
export const MEJA_12_ITEMS = [
  { price: PRODUK.ayamBakarMadu.price, quantity: 1 },
  { price: PRODUK.airMineral.price, quantity: 1 },
];
export const MEJA_12_BILLING = {
  subtotal: 37000,
  tax: 3700,
  serviceCharge: 1850,
  total: 42550,
};

// ── Pembayaran tunai ─────────────────────────────────────────────────────────
export const TUNAI = {
  kosong: 0,
  kurangSeRupiah: 42549,
  pas: 42550,
  limaPuluhRibu: 50000,
};

// ── Status stok ──────────────────────────────────────────────────────────────
export const STOK_BATAS = {
  minimum: 20,
  samaDenganMinimum: 20,
  minimumPlusSatu: 21,
};

// ── Update stok ──────────────────────────────────────────────────────────────
export const UPDATE_STOK_AIR_MINERAL = { stockBefore: 150, newStock: 200, diff: 50 };

// ── Produk baru (form) ───────────────────────────────────────────────────────
export const PRODUK_VALID = {
  code: "MU-099",
  name: "Nasi Liwet Teri",
  categoryId: "cat-makanan-utama",
  price: "28000",
  stock: "25",
  minStock: "5",
  unit: "porsi",
  imageUrl: "",
};

// ── Laporan: contoh pesanan lunas September 2026 (waktu dalam UTC) ─────────
export const PESANAN_LAPORAN = [
  {
    id: "o-1",
    orderNumber: "#TRX-20260921-0001",
    createdAt: new Date("2026-09-21T05:00:00.000Z"), // Senin 21 Sep 12:00 WIB
    orderType: "DINE_IN",
    tableNumber: "12",
    customerName: null,
    total: 42550,
    payment: { method: "CASH" },
    items: [
      { productId: PRODUK.ayamBakarMadu.id, productName: "Ayam Bakar Madu", quantity: 1, subtotal: 32000, product: { category: { name: "Makanan Utama" } } },
      { productId: PRODUK.airMineral.id, productName: "Air Mineral", quantity: 1, subtotal: 5000, product: { category: { name: "Minuman" } } },
    ],
  },
  {
    id: "o-2",
    orderNumber: "#TRX-20260921-0002",
    createdAt: new Date("2026-09-21T11:00:00.000Z"), // Senin 21 Sep 18:00 WIB
    orderType: "TAKE_AWAY",
    tableNumber: null,
    customerName: "Budi",
    total: 46000, // 40.000 + pajak 4.000 + service 2.000
    payment: { method: "QRIS" },
    items: [
      { productId: PRODUK.ayamBakarMadu.id, productName: "Ayam Bakar Madu", quantity: 1, subtotal: 32000, product: { category: { name: "Makanan Utama" } } },
      { productId: PRODUK.esJeruk.id, productName: "Es Jeruk", quantity: 1, subtotal: 8000, product: { category: { name: "Minuman" } } },
    ],
  },
  {
    id: "o-3",
    orderNumber: "#TRX-20260923-0001",
    createdAt: new Date("2026-09-22T18:00:00.000Z"), // Rabu 23 Sep 01:00 WIB
    orderType: "DINE_IN",
    tableNumber: "3",
    customerName: null,
    total: 17250, // 15.000 + pajak 1.500 + service 750
    payment: { method: "DEBIT" },
    items: [
      { productId: PRODUK.airMineral.id, productName: "Air Mineral", quantity: 3, subtotal: 15000, product: { category: { name: "Minuman" } } },
    ],
  },
];
export const TOTAL_PENDAPATAN_LAPORAN = 42550 + 46000 + 17250; // 105.800
