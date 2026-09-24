"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { productSchema } from "@/lib/validations";

export type ActionResult = { ok: boolean; message: string };

export async function createProduct(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;

  const existing = await prisma.product.findUnique({ where: { code: d.code } });
  if (existing) return { ok: false, message: `Kode "${d.code}" sudah dipakai.` };

  const session = await requireAdmin();
  const created = await prisma.product.create({
    data: {
      code: d.code,
      name: d.name,
      categoryId: d.categoryId,
      price: d.price,
      stock: d.stock,
      minStock: d.minStock,
      unit: d.unit,
      imageUrl: d.imageUrl || null,
    },
  });
  if (d.stock > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: created.id,
        type: "IN",
        quantity: d.stock,
        stockBefore: 0,
        stockAfter: d.stock,
        note: "Stok awal produk baru",
        userId: session.user.id,
      },
    });
  }

  revalidatePath("/produk");
  revalidatePath("/stok");
  revalidatePath("/dashboard");
  return { ok: true, message: "Produk berhasil ditambahkan." };
}

export async function updateProduct(id: string, raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;

  const clash = await prisma.product.findFirst({
    where: { code: d.code, NOT: { id } },
  });
  if (clash) return { ok: false, message: `Kode "${d.code}" sudah dipakai produk lain.` };

  await prisma.product.update({
    where: { id },
    data: {
      code: d.code,
      name: d.name,
      categoryId: d.categoryId,
      price: d.price,
      minStock: d.minStock,
      unit: d.unit,
      imageUrl: d.imageUrl || null,
    },
  });

  revalidatePath("/produk");
  revalidatePath("/stok");
  revalidatePath("/dashboard");
  return { ok: true, message: "Produk berhasil diperbarui." };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/produk");
  revalidatePath("/stok");
  return { ok: true, message: "Produk dinonaktifkan." };
}
