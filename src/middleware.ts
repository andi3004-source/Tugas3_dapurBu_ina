import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// Route yang hanya boleh diakses ADMIN
const ADMIN_ONLY = ["/produk", "/laporan", "/pengaturan"];
const CASHIER_ONLY = ["/kasir", "/pembayaran", "/pesanan/baru"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const path = nextUrl.pathname;

  const isAuthPage = path === "/login";

  // Belum login → paksa ke /login
  if (!isLoggedIn) {
    if (isAuthPage) return NextResponse.next();
    const url = new URL("/login", nextUrl);
    if (path !== "/") url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  // Sudah login tapi buka /login atau root → arahkan ke dashboard
  if (isAuthPage || path === "/") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Cek role untuk halaman khusus ADMIN
  const needsAdmin = ADMIN_ONLY.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  if (needsAdmin && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/403", nextUrl));
  }

  // Halaman operasional kasir hanya boleh diakses oleh akun KASIR.
  const needsCashier = CASHIER_ONLY.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
  if (needsCashier && role !== "KASIR") {
    return NextResponse.redirect(new URL("/403", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
