"use client";

import { useState, useTransition } from "react";
import { PlusCircle, SlidersHorizontal } from "lucide-react";
import { stockIn, stockAdjust } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Product = { id: string; name: string; stock: number; unit: string; code: string };

export function StockDialog({
  mode,
  products,
  presetProductId,
  trigger,
}: {
  mode: "IN" | "ADJUST";
  products: Product[];
  presetProductId?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const [productId, setProductId] = useState(presetProductId ?? products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [newStock, setNewStock] = useState("");
  const [note, setNote] = useState("");

  const selected = products.find((p) => p.id === productId);
  const isIn = mode === "IN";

  function resetFields() {
    setQuantity("");
    setNewStock("");
    setNote("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = isIn
        ? await stockIn({ productId, quantity, note })
        : await stockAdjust({ productId, newStock, note });
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Berhasil" : "Gagal",
        description: res.message,
      });
      if (res.ok) {
        setOpen(false);
        resetFields();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setProductId(presetProductId ?? products[0]?.id ?? "");
          resetFields();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isIn ? <PlusCircle className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
            {isIn ? "Input Stok Masuk" : "Update / Penyesuaian Stok"}
          </DialogTitle>
          <DialogDescription>
            {isIn
              ? "Tambahkan jumlah stok yang masuk ke gudang."
              : "Setel ulang nilai stok sesuai hasil pengecekan fisik."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Produk *</Label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={!!presetProductId}
              className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            {selected && (
              <p className="text-xs text-muted-foreground">
                Stok saat ini: <span className="font-semibold text-navy">{selected.stock}</span>{" "}
                {selected.unit}
              </p>
            )}
          </div>

          {isIn ? (
            <div className="space-y-1.5">
              <Label>Jumlah Masuk *</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Contoh: 20"
                required
              />
              {selected && quantity && (
                <p className="text-xs text-brand-leaf">
                  Stok akhir menjadi {selected.stock + (Number(quantity) || 0)}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Stok Baru *</Label>
              <Input
                type="number"
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="Contoh: 15"
                required
              />
              {selected && newStock !== "" && (
                <p className="text-xs text-muted-foreground">
                  Perubahan: {Number(newStock) - selected.stock >= 0 ? "+" : ""}
                  {Number(newStock) - selected.stock}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{isIn ? "Catatan (opsional)" : "Alasan Penyesuaian *"}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isIn ? "Contoh: Kiriman supplier" : "Contoh: Koreksi stok opname"}
              required={!isIn}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
