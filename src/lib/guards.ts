import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Pastikan user login; kembalikan session. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/** Pastikan user ADMIN; jika bukan → 403. */
export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "ADMIN") redirect("/403");
  return session;
}

/** Pastikan user KASIR; jika bukan → 403. */
export async function requireCashier() {
  const session = await requireUser();
  if (session.user.role !== "KASIR") redirect("/403");
  return session;
}
