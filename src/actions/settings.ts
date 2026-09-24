"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/guards";
import {
  settingSchema,
  userCreateSchema,
  passwordChangeSchema,
} from "@/lib/validations";
import type { ActionResult } from "@/actions/products";

export async function updateSetting(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const existing = await prisma.setting.findFirst();
  if (existing) {
    await prisma.setting.update({ where: { id: existing.id }, data: parsed.data });
  } else {
    await prisma.setting.create({ data: parsed.data });
  }
  revalidatePath("/pengaturan");
  return { ok: true, message: "Pengaturan restoran disimpan." };
}

export async function createUser(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = userCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;
  const exists = await prisma.user.findUnique({ where: { username: d.username } });
  if (exists) return { ok: false, message: `Username "${d.username}" sudah dipakai.` };

  const passwordHash = await bcrypt.hash(d.password, 10);
  await prisma.user.create({
    data: { name: d.name, username: d.username, role: d.role, passwordHash },
  });
  revalidatePath("/pengaturan");
  return { ok: true, message: "Pengguna berhasil ditambahkan." };
}

export async function updateUser(
  id: string,
  data: { name: string; role: "ADMIN" | "KASIR" },
): Promise<ActionResult> {
  await requireAdmin();
  if (!data.name?.trim()) return { ok: false, message: "Nama wajib diisi." };
  await prisma.user.update({
    where: { id },
    data: { name: data.name.trim(), role: data.role },
  });
  revalidatePath("/pengaturan");
  return { ok: true, message: "Data pengguna diperbarui." };
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (session.user.id === id) {
    return { ok: false, message: "Tidak dapat menghapus akun sendiri." };
  }
  const linked = await prisma.order.count({ where: { cashierId: id } });
  if (linked > 0) {
    return {
      ok: false,
      message: "Pengguna memiliki riwayat transaksi dan tidak dapat dihapus.",
    };
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/pengaturan");
  return { ok: true, message: "Pengguna dihapus." };
}

export async function resetPassword(id: string, newPassword: string): Promise<ActionResult> {
  await requireAdmin();
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, message: "Password minimal 6 karakter." };
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  return { ok: true, message: "Password berhasil direset." };
}

export async function changeOwnPassword(raw: unknown): Promise<ActionResult> {
  const session = await requireUser();
  const parsed = passwordChangeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { ok: false, message: "Pengguna tidak ditemukan." };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { ok: false, message: "Password saat ini salah." };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { ok: true, message: "Password berhasil diubah." };
}
