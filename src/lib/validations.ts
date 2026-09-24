import { z } from "zod";

export const productSchema = z.object({
  code: z.string().trim().min(1, "Kode wajib diisi"),
  name: z.string().trim().min(1, "Nama produk wajib diisi"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  price: z.coerce.number().int().positive("Harga harus lebih dari 0"),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif"),
  minStock: z.coerce.number().int().min(0, "Stok minimum tidak boleh negatif"),
  unit: z.string().trim().min(1, "Satuan wajib diisi"),
  imageUrl: z
    .string()
    .trim()
    .url("URL gambar tidak valid")
    .or(z.literal(""))
    .refine(
      (value) => value === "" || /^https?:\/\//i.test(value),
      "URL gambar harus diawali http:// atau https://",
    )
    .optional(),
});
export type ProductInput = z.infer<typeof productSchema>;

export const stockInSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  quantity: z.coerce.number().int().positive("Jumlah harus lebih dari 0"),
  note: z.string().trim().max(200).optional(),
});

export const stockAdjustSchema = z.object({
  productId: z.string().min(1, "Produk wajib dipilih"),
  newStock: z.coerce.number().int().min(0, "Stok baru tidak boleh negatif"),
  note: z.string().trim().min(1, "Alasan penyesuaian wajib diisi").max(200),
});

export const orderSchema = z.object({
  orderType: z.enum(["DINE_IN", "TAKE_AWAY"]),
  tableNumber: z.string().trim().optional(),
  customerName: z.string().trim().optional(),
  note: z.string().trim().max(300).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1, "Minimal 1 item"),
});

export const paymentSchema = z
  .object({
    orderId: z.string().min(1),
    method: z.enum(["CASH", "DEBIT", "CREDIT_CARD", "QRIS"]),
    amountPaid: z.coerce.number().int().min(0),
    referenceNo: z.string().trim().optional(),
    cardLast4: z.string().trim().optional(),
  })
  .refine(
    (d) =>
      d.method !== "DEBIT" && d.method !== "CREDIT_CARD"
        ? true
        : !!d.cardLast4 && /^\d{4}$/.test(d.cardLast4),
    { message: "4 digit terakhir kartu wajib diisi", path: ["cardLast4"] },
  )
  .refine((d) => (d.method === "QRIS" ? !!d.referenceNo : true), {
    message: "Nomor referensi wajib diisi",
    path: ["referenceNo"],
  });

export const settingSchema = z.object({
  restaurantName: z.string().trim().min(1, "Nama restoran wajib diisi"),
  tagline: z.string().trim().min(1, "Tagline wajib diisi"),
  address: z.string().trim().min(1, "Alamat wajib diisi"),
  phone: z.string().trim().min(1, "Telepon wajib diisi"),
  taxPercent: z.coerce.number().int().min(0).max(100),
  servicePercent: z.coerce.number().int().min(0).max(100),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
  username: z.string().trim().min(3, "Username minimal 3 karakter"),
  role: z.enum(["ADMIN", "KASIR"]),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });
