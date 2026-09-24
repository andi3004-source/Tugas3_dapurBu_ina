import type { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { getStockStatus, stockStatusLabel } from "@/lib/utils";
import { orderStatusLabel } from "@/lib/format-labels";

export function StockStatusBadge({
  stock,
  minStock,
}: {
  stock: number;
  minStock: number;
}) {
  const status = getStockStatus(stock, minStock);
  const variant =
    status === "AMAN" ? "success" : status === "HAMPIR_HABIS" ? "warning" : "danger";
  return <Badge variant={variant}>{stockStatusLabel[status]}</Badge>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant =
    status === "PAID" ? "success" : status === "PENDING" ? "warning" : "muted";
  return <Badge variant={variant}>{orderStatusLabel[status]}</Badge>;
}
