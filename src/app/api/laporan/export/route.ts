import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guards";
import { getReport, type Period } from "@/lib/reports";
import { paymentMethodLabel, orderTypeLabel } from "@/lib/format-labels";
import { formatTanggalWaktu } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") === "monthly" ? "monthly" : "weekly";
  const value = searchParams.get("value") ?? "";

  const report = await getReport({ type, value } as Period);

  const rows: string[][] = [
    ["Laporan Penjualan", report.label],
    ["Total Pendapatan", String(report.summary.totalRevenue)],
    ["Jumlah Transaksi", String(report.summary.totalTx)],
    ["Rata-rata Transaksi", String(report.summary.avgTx)],
    [],
    ["No", "No Pesanan", "Tanggal", "Tipe", "Meja/Pelanggan", "Metode", "Total"],
    ...report.orders.map((o, i) => [
      String(i + 1),
      o.orderNumber,
      formatTanggalWaktu(o.createdAt),
      orderTypeLabel[o.type],
      o.type === "DINE_IN" ? `Meja ${o.table}` : (o.customer ?? "-"),
      o.method ? paymentMethodLabel[o.method] : "-",
      String(o.total),
    ]),
  ];

  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const filename = `laporan-${type}-${value || "current"}.csv`;
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
