"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({
  label = "Cetak Struk",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Button variant="outline" className={className} onClick={() => window.print()}>
      <Printer className="h-4 w-4" /> {label}
    </Button>
  );
}
