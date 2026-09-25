import { describe, expect, it } from "vitest";
import { resolveAccess } from "@/lib/access";
import { navForRole } from "@/lib/nav";

const NEXT = { action: "next" };
const FORBIDDEN = { action: "redirect", to: "/403" };

describe("U10 - Hak akses role", () => {
  it("U10-01 ADMIN boleh membuka /produk, /laporan, /pengaturan", () => {
    for (const path of ["/produk", "/laporan", "/pengaturan"]) {
      expect(resolveAccess(path, "ADMIN", true)).toEqual(NEXT);
    }
  });

  it("U10-02 [salah] KASIR membuka halaman khusus ADMIN diarahkan ke /403", () => {
    for (const path of ["/produk", "/laporan", "/pengaturan"]) {
      expect(resolveAccess(path, "KASIR", true)).toEqual(FORBIDDEN);
    }
  });

  it("U10-03 [batas] sub-route admin (/laporan/mingguan) juga terlindungi", () => {
    expect(resolveAccess("/laporan/mingguan", "KASIR", true)).toEqual(FORBIDDEN);
  });

  it("U10-04 KASIR boleh membuka /kasir, /pembayaran, /pesanan/baru", () => {
    for (const path of ["/kasir", "/kasir/detail", "/pembayaran", "/pesanan/baru"]) {
      expect(resolveAccess(path, "KASIR", true)).toEqual(NEXT);
    }
  });

  it("U10-05 [salah] ADMIN membuka halaman operasional kasir diarahkan ke /403", () => {
    for (const path of ["/kasir", "/pembayaran", "/pesanan/baru"]) {
      expect(resolveAccess(path, "ADMIN", true)).toEqual(FORBIDDEN);
    }
  });

  it("U10-06 halaman bersama (/dashboard, /pesanan, /stok) boleh untuk kedua role", () => {
    for (const path of ["/dashboard", "/pesanan", "/pesanan/abc/billing", "/stok"]) {
      expect(resolveAccess(path, "ADMIN", true)).toEqual(NEXT);
      expect(resolveAccess(path, "KASIR", true)).toEqual(NEXT);
    }
  });

  it("U10-07 [batas] route berawalan mirip (/produktif, /pesanan/baruan) tidak ikut terkunci", () => {
    expect(resolveAccess("/produktif", "KASIR", true)).toEqual(NEXT);
    expect(resolveAccess("/pesanan/baruan", "ADMIN", true)).toEqual(NEXT);
  });

  it("U10-08 [salah] belum login diarahkan ke /login dengan callbackUrl", () => {
    expect(resolveAccess("/stok", undefined, false)).toEqual({
      action: "redirect",
      to: "/login",
      callbackUrl: "/stok",
    });
    expect(resolveAccess("/", undefined, false)).toEqual({ action: "redirect", to: "/login" });
    expect(resolveAccess("/login", undefined, false)).toEqual(NEXT);
  });

  it("U10-09 sudah login membuka /login atau / diarahkan ke /dashboard", () => {
    expect(resolveAccess("/login", "KASIR", true)).toEqual({ action: "redirect", to: "/dashboard" });
    expect(resolveAccess("/", "ADMIN", true)).toEqual({ action: "redirect", to: "/dashboard" });
  });

  it("U10-10 [salah] sesi tanpa role tidak bisa membuka halaman ADMIN maupun KASIR", () => {
    expect(resolveAccess("/produk", undefined, true)).toEqual(FORBIDDEN);
    expect(resolveAccess("/kasir", undefined, true)).toEqual(FORBIDDEN);
  });

  it("U10-11 menu sidebar sesuai aturan akses tiap role", () => {
    expect(navForRole("ADMIN").map((i) => i.href)).toEqual([
      "/dashboard",
      "/pesanan",
      "/produk",
      "/stok",
      "/laporan",
      "/pengaturan",
    ]);
    expect(navForRole("KASIR").map((i) => i.href)).toEqual(["/dashboard", "/kasir", "/pesanan", "/stok"]);
  });
});
