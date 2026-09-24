"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil } from "lucide-react";
import { productSchema, type ProductInput } from "@/lib/validations";
import { createProduct, updateProduct } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

type Category = { id: string; name: string };
type Product = {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl: string | null;
};

export function ProductDialog({
  categories,
  product,
  trigger,
}: {
  categories: Category[];
  product?: Product;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          code: product.code,
          name: product.name,
          categoryId: product.categoryId,
          price: product.price,
          stock: product.stock,
          minStock: product.minStock,
          unit: product.unit,
          imageUrl: product.imageUrl ?? "",
        }
      : {
          code: "",
          name: "",
          categoryId: categories[0]?.id ?? "",
          price: 0,
          stock: 0,
          minStock: 0,
          unit: "porsi",
          imageUrl: "",
        },
  });

  function onSubmit(values: ProductInput) {
    startTransition(async () => {
      const res = isEdit
        ? await updateProduct(product!.id, values)
        : await createProduct(values);
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Berhasil" : "Gagal",
        description: res.message,
      });
      if (res.ok) {
        setOpen(false);
        if (!isEdit) reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> Tambah Produk
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Edit Produk" : "Tambah Produk"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi detail produk. Field bertanda * wajib diisi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Kode *</Label>
              <Input placeholder="MU-001" {...register("code")} />
              {errors.code && <p className="text-xs text-brand-chili">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Kategori *</Label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("categoryId")}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-brand-chili">{errors.categoryId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nama Produk *</Label>
            <Input placeholder="Ayam Bakar Madu" {...register("name")} />
            {errors.name && <p className="text-xs text-brand-chili">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Harga (Rp) *</Label>
              <Input type="number" min={0} {...register("price")} />
              {errors.price && <p className="text-xs text-brand-chili">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Satuan *</Label>
              <Input placeholder="porsi / gelas" {...register("unit")} />
              {errors.unit && <p className="text-xs text-brand-chili">{errors.unit.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stok {isEdit ? "" : "Awal"} {isEdit && "(via menu Stok)"}</Label>
              <Input type="number" min={0} disabled={isEdit} {...register("stock")} />
              {errors.stock && <p className="text-xs text-brand-chili">{errors.stock.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Stok Minimum *</Label>
              <Input type="number" min={0} {...register("minStock")} />
              {errors.minStock && (
                <p className="text-xs text-brand-chili">{errors.minStock.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>URL Gambar (opsional)</Label>
            <Input placeholder="https://..." {...register("imageUrl")} />
            {errors.imageUrl && (
              <p className="text-xs text-brand-chili">{errors.imageUrl.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
