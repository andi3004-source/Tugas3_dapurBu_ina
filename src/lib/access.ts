export type Role = "ADMIN" | "KASIR";

// Route yang hanya boleh diakses ADMIN
export const ADMIN_ONLY = ["/produk", "/laporan", "/pengaturan"];
// Halaman operasional kasir hanya boleh diakses oleh akun KASIR.
export const CASHIER_ONLY = ["/kasir", "/pembayaran", "/pesanan/baru"];

export function matchesRoute(path: string, prefixes: string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export type AccessDecision =
  | { action: "next" }
  | { action: "redirect"; to: string; callbackUrl?: string };

/** Aturan akses middleware: login wajib, lalu cek role per route. */
export function resolveAccess(
  path: string,
  role: Role | undefined,
  isLoggedIn: boolean,
): AccessDecision {
  const isAuthPage = path === "/login";

  // Belum login → paksa ke /login
  if (!isLoggedIn) {
    if (isAuthPage) return { action: "next" };
    return path !== "/"
      ? { action: "redirect", to: "/login", callbackUrl: path }
      : { action: "redirect", to: "/login" };
  }

  // Sudah login tapi buka /login atau root → arahkan ke dashboard
  if (isAuthPage || path === "/") return { action: "redirect", to: "/dashboard" };

  if (matchesRoute(path, ADMIN_ONLY) && role !== "ADMIN") {
    return { action: "redirect", to: "/403" };
  }
  if (matchesRoute(path, CASHIER_ONLY) && role !== "KASIR") {
    return { action: "redirect", to: "/403" };
  }
  return { action: "next" };
}
