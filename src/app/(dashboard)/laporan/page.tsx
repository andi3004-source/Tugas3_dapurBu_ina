import { Wallet, Receipt, TrendingUp, Trophy } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { getReport, type Period } from "@/lib/reports";
import { getSetting } from "@/lib/settings";
import { formatRupiah, formatNumber, formatTanggalWaktu } from "@/lib/utils";
import { orderTypeLabel, paymentMethodLabel } from "@/lib/format-labels";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AutoRefresh } from "@/components/auto-refresh";
import { PeriodSelector } from "./period-selector";
import { TrendChart, CategoryBar, MethodDonut } from "./report-charts";

export const dynamic = "force-dynamic";

function currentWeekString(): string {
  const d = new Date();
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7,
    );
  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function currentMonthString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type SP = { type?: string; value?: string };

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const type = sp.type === "monthly" ? "monthly" : "weekly";
  const value = sp.value || (type === "weekly" ? currentWeekString() : currentMonthString());

  const [report, setting] = await Promise.all([
    getReport({ type, value } as Period),
    getSetting(),
  ]);
  const s = report.summary;

  return (
    <div className="space-y-6">
      <AutoRefresh interval={10000} />
      <PageHeader title="Laporan Penjualan" description="Ringkasan performa penjualan berkala." />

      <Card className="no-print">
        <CardContent className="pt-6">
          <PeriodSelector type={type} value={value} />
        </CardContent>
      </Card>

      {/* Area cetak */}
      <div className="print-report space-y-6">
        <div className="hidden print:block">
          <h1 className="font-serif text-xl font-bold text-navy">Laporan Penjualan — {setting.restaurantName}</h1>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-1 pt-6">
            <p className="text-sm text-muted-foreground">Periode Laporan</p>
            <p className="text-lg font-bold text-navy">
              {type === "weekly" ? "Mingguan" : "Bulanan"} · {report.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTanggalWaktu(report.start)} — {formatTanggalWaktu(report.end)}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={<Wallet className="h-5 w-5" />} label="Total Pendapatan" value={formatRupiah(s.totalRevenue)} tone="blue" />
          <Stat icon={<Receipt className="h-5 w-5" />} label="Jumlah Transaksi" value={formatNumber(s.totalTx)} tone="violet" />
          <Stat icon={<TrendingUp className="h-5 w-5" />} label="Rata-rata Transaksi" value={formatRupiah(s.avgTx)} tone="emerald" />
          <Stat icon={<Trophy className="h-5 w-5" />} label="Produk Terlaris" value={s.topProduct} tone="orange" small />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tren Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={report.trend} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Penjualan per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBar data={report.byCategory} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <MethodDonut data={report.byMethod} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Qty Terjual</TableHead>
                  <TableHead className="text-right">Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.topProducts.map((p, i) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-semibold text-navy">{p.name}</TableCell>
                    <TableCell>{formatNumber(p.qty)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatRupiah(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {report.topProducts.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detail Transaksi ({report.orders.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No Pesanan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs font-semibold text-navy">{o.orderNumber}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatTanggalWaktu(o.createdAt)}</TableCell>
                    <TableCell className="text-sm">{orderTypeLabel[o.type]}</TableCell>
                    <TableCell>
                      {o.method ? <Badge variant="muted">{paymentMethodLabel[o.method]}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatRupiah(o.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {report.orders.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada transaksi pada periode ini.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "blue" | "violet" | "emerald" | "orange";
  small?: boolean;
}) {
  const tones: Record<string, string> = {
    blue: "bg-primary/10 text-primary",
    violet: "bg-brand-terracotta/15 text-brand-terracotta",
    emerald: "bg-brand-leaf/15 text-brand-leaf",
    orange: "bg-brand-gold/15 text-brand-gold",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          {icon}
        </span>
        <p className="mt-3 text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 font-extrabold text-navy ${small ? "text-lg" : "text-2xl"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
