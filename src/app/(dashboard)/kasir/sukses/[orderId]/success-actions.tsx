"use client";

import { useRouter } from "next/navigation";
import { Printer, Plus } from "lucide-react";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";

export function SuccessActions() {
  const router = useRouter();
  const clear = useCart((s) => s.clear);

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="outline" className="flex-1" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Cetak Struk
      </Button>
      <Button
        className="flex-1"
        onClick={() => {
          clear();
          router.push("/kasir");
        }}
      >
        <Plus className="h-4 w-4" /> Transaksi Baru
      </Button>
    </div>
  );
}
