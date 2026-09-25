import { describe, expect, it } from "vitest";
import {
  formatJuta,
  formatNumber,
  formatRupiah,
  formatTanggalPanjang,
  formatTanggalWaktu,
  formatWaktu,
  persen,
} from "@/lib/utils";

// Intl memakai spasi tak-putus (U+00A0) antara "Rp" dan angka; samakan ke spasi biasa.
const plain = (s: string) => s.replace(/ /g, " ");

describe("U9 - Format rupiah & tanggal", () => {
  it("U9-01 total Meja 12 diformat Rp 42.550", () => {
    expect(plain(formatRupiah(42550))).toBe("Rp 42.550");
  });

  it("U9-02 [batas] nol diformat Rp 0", () => {
    expect(plain(formatRupiah(0))).toBe("Rp 0");
  });

  it("U9-03 [batas] pecahan dibulatkan ke rupiah terdekat (1.234,6 → Rp 1.235)", () => {
    expect(plain(formatRupiah(1234.6))).toBe("Rp 1.235");
  });

  it("U9-04 [salah] nilai null/undefined tidak error, tampil Rp 0", () => {
    expect(plain(formatRupiah(null as unknown as number))).toBe("Rp 0");
    expect(plain(formatRupiah(undefined as unknown as number))).toBe("Rp 0");
  });

  it("U9-05 angka ribuan & juta memakai pemisah titik id-ID", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
    expect(formatJuta(4280000)).toBe("4,28 jt");
  });

  it("U9-06 tanggal panjang zona Asia/Jakarta: Rabu, 23 September 2026", () => {
    expect(formatTanggalPanjang(new Date("2026-09-23T03:00:00.000Z"))).toBe("Rabu, 23 September 2026");
  });

  it("U9-07 [batas] 17:00 UTC = 00:00 WIB sudah berganti ke Kamis, 24 September 2026", () => {
    expect(formatTanggalPanjang(new Date("2026-09-23T16:59:59.000Z"))).toBe("Rabu, 23 September 2026");
    expect(formatTanggalPanjang(new Date("2026-09-23T17:00:00.000Z"))).toBe("Kamis, 24 September 2026");
  });

  it("U9-08 tanggal+waktu dan waktu memakai jam WIB (07:32 UTC → 14.32)", () => {
    const d = new Date("2026-09-23T07:32:00.000Z");
    expect(formatTanggalWaktu(d)).toBe("23 Sep 2026, 14.32");
    expect(formatWaktu(d)).toBe("14.32");
  });

  it("U9-09 persentase perubahan: naik 10%, dari 0 ke >0 = 100%, 0 ke 0 = 0%", () => {
    expect(persen(110, 100)).toBe(10);
    expect(persen(5, 0)).toBe(100);
    expect(persen(0, 0)).toBe(0);
  });
});
