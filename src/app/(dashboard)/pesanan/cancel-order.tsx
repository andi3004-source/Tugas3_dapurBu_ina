"use client";

import { useState, useTransition } from "react";
import { XCircle } from "lucide-react";
import { cancelOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
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

export function CancelOrder({ id, orderNumber }: { id: string; orderNumber: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function onCancel() {
    startTransition(async () => {
      const res = await cancelOrder(id);
      toast({
        variant: res.ok ? "success" : "destructive",
        title: res.ok ? "Berhasil" : "Gagal",
        description: res.message,
      });
      if (res.ok) setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-brand-chili hover:bg-brand-chili/10">
          <XCircle className="h-4 w-4" /> Batalkan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Batalkan pesanan?</DialogTitle>
          <DialogDescription>
            Pesanan <span className="font-semibold text-navy">{orderNumber}</span> akan
            dibatalkan dan stok item akan dikembalikan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Kembali
          </Button>
          <Button variant="destructive" onClick={onCancel} disabled={pending}>
            {pending ? "Memproses..." : "Ya, Batalkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
