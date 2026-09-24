"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  // Tentukan tujuan redirect berdasarkan role (KASIR → halaman kasir)
  const user = await prisma.user.findUnique({
    where: { username },
    select: { role: true },
  });
  const redirectTo = user?.role === "KASIR" ? "/kasir" : "/dashboard";

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Username atau password salah." };
    }
    // Redirect dari signIn dilempar sebagai error khusus Next → teruskan
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
