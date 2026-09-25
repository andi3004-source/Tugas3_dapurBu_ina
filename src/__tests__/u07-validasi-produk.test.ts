import { describe, expect, it } from "vitest";
import { productSchema } from "@/lib/validations";
import { PRODUK_VALID } from "./fixtures";

function errorsOf(input: Record<string, unknown>) {
  const res = productSchema.safeParse({ ...PRODUK_VALID, ...input });
  return res.success ? {} : Object.fromEntries(res.error.issues.map((i) => [i.path.join("."), i.message]));
}

describe("U7 - Validasi form produk (zod)", () => {
  it("U7-01 data produk lengkap diterima dan angka string dikonversi ke number", () => {
    const res = productSchema.safeParse(PRODUK_VALID);
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toMatchObject({ price: 28000, stock: 25, minStock: 5 });
  });

  it("U7-02 [salah] kode, nama, kategori, dan satuan kosong ditolak dengan pesan wajib", () => {
    expect(errorsOf({ code: "", name: "", categoryId: "", unit: "" })).toEqual({
      code: "Kode wajib diisi",
      name: "Nama produk wajib diisi",
      categoryId: "Kategori wajib dipilih",
      unit: "Satuan wajib diisi",
    });
  });

  it("U7-03 [salah] nama berisi spasi saja ditolak (di-trim)", () => {
    expect(errorsOf({ name: "    " })).toEqual({ name: "Nama produk wajib diisi" });
  });

  it("U7-04 [batas] harga 0 ditolak, harga 1 diterima", () => {
    expect(errorsOf({ price: 0 })).toEqual({ price: "Harga harus lebih dari 0" });
    expect(errorsOf({ price: 1 })).toEqual({});
  });

  it("U7-05 [salah] harga negatif ditolak", () => {
    expect(errorsOf({ price: -32000 })).toEqual({ price: "Harga harus lebih dari 0" });
  });

  it("U7-06 [salah] harga desimal (1500.5) ditolak karena rupiah bulat", () => {
    expect(errorsOf({ price: 1500.5 })).toHaveProperty("price");
  });

  it("U7-07 [batas] stok 0 diterima, stok -1 ditolak", () => {
    expect(errorsOf({ stock: 0 })).toEqual({});
    expect(errorsOf({ stock: -1 })).toEqual({ stock: "Stok tidak boleh negatif" });
  });

  it("U7-08 [salah] stok minimum negatif ditolak", () => {
    expect(errorsOf({ minStock: -1 })).toEqual({ minStock: "Stok minimum tidak boleh negatif" });
  });

  it("U7-09 [salah] stok berupa teks (abc) ditolak", () => {
    expect(errorsOf({ stock: "abc" })).toHaveProperty("stock");
  });

  it("U7-10 URL gambar https diterima, ftp ditolak", () => {
    expect(errorsOf({ imageUrl: "https://images.unsplash.com/photo-1.jpg" })).toEqual({});
    expect(errorsOf({ imageUrl: "ftp://server/gambar.jpg" })).toEqual({
      imageUrl: "URL gambar harus diawali http:// atau https://",
    });
  });
});
