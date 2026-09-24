import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  Receipt,
  PackageX,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { requireUser } from "@/lib/guards";
import { getDashboardData } from "@/lib/dashboard";
import { getSetting } from "@/lib/settings";
import { formatRupiah, formatNumber, persen, cn } from "@/lib/utils";
import { orderTypeLabel, paymentMethodLabel } from "@/lib/format-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StockStatusBadge, OrderStatusBadge } from "@/components/status-badges";
import { WeeklyChart, CategoryDonut, CATEGORY_COLORS } from "@/components/dashboard/charts";
import { formatTanggalWaktu } from "@/lib/utils";
import { AutoRefresh } from "@/components/auto-refresh";
import { LastUpdated } from "@/components/last-updated";

export const dynamic = "force-dynamic";

function Trend({ value, invert = false }: { value: number; invert?: boolean }) {
  const up = value >= 0;
  const good = invert ? !up : up;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        good ? "text-brand-leaf" : "text-brand-chili",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export default async function DashboardPage() {
  const session = await requireUser();
  const [data, setting] = await Promise.all([getDashboardData(), getSetting()]);
  const s = data.stats;

  const salesTrend = persen(s.todaySales, s.yesterdaySales);
  const orderTrend = persen(s.todayCount, s.yesterdayCount);
  const avgTrend = persen(s.todayAvg, s.yesterdayAvg);
  const orderDiff = s.todayCount - s.yesterdayCount;

  const topCategory = [...data.salesByCategory].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="space-y-6">
      <AutoRefresh interval={5000} />
      <div className="flex justify-end">
        <LastUpdated key={Date.now()} />
      </div>
      {/* Sapaan */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-brand-teal to-brand-tealdark text-brand-cream">
        {/* ornamen daun/emas tipis */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 90% -10%, rgba(201,148,46,0.5), transparent 40%), radial-gradient(circle at 10% 120%, rgba(110,139,74,0.4), transparent 45%)",
          }}
        />
        <CardContent className="relative flex items-center justify-between gap-4 p-6">
          <div>
            <h1 className="font-serif text-2xl font-bold">
              Selamat Datang di {setting.restaurantName}
            </h1>
            <p className="mt-1 text-sm text-brand-cream/85">
              Semangat hari ini, {session.user.name}! Semoga semua pesanan berjalan lancar.
            </p>
            <p className="mt-3 font-hand text-2xl text-brand-gold">
              Masak dengan hati, Sajikan dengan cinta
            </p>
          </div>
          <Image
            src="/brand/logo.png"
            alt={setting.restaurantName}
            width={96}
            height={96}
            className="hidden shrink-0 rounded-full ring-4 ring-brand-cream/20 md:block"
          />
        </CardContent>
      </Card>

      {/* 4 kartu statistik */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Penjualan Hari Ini"
          value={formatRupiah(s.todaySales)}
          footer={<><Trend value={salesTrend} /> <span className="text-muted-foreground">vs kemarin</span></>}
          tone="blue"
        />
        <StatCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Total Pesanan"
          value={formatNumber(s.todayCount)}
          footer={
            <span className="text-xs text-muted-foreground">
              {orderDiff >= 0 ? "+" : ""}
              {orderDiff} pesanan vs kemarin
            </span>
          }
          tone="violet"
        />
        <StatCard
          icon={<Receipt className="h-5 w-5" />}
          label="Rata-rata Transaksi"
          value={formatRupiah(s.todayAvg)}
          footer={<><Trend value={avgTrend} /> <span className="text-muted-foreground">vs kemarin</span></>}
          tone="emerald"
        />
        <StatCard
          icon={<PackageX className="h-5 w-5" />}
          label="Stok Menipis"
          value={`${s.lowStockCount} item`}
          footer={<span className="text-xs font-semibold text-brand-gold">Perlu restock</span>}
          tone="orange"
        />
      </div>

      {/* Grafik + kategori */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Penjualan 7 Hari Terakhir</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Penjualan</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-brand-gold" /> Pesanan</span>
            </div>
          </CardHeader>
          <CardContent>
            <WeeklyChart data={data.last7Days} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Kategori</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CategoryDonut data={data.salesByCategory} total={data.catTotal} />
            <div className="space-y-3">
              {data.salesByCategory.map((c, i) => (
                <div key={c.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-navy">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: CATEGORY_COLORS[i % 3] }}
                      />
                      {c.name}
                    </span>
                    <span className="text-muted-foreground">{c.percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.percent}%`, background: CATEGORY_COLORS[i % 3] }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-accent p-3 text-xs text-primary">
              <Sparkles className="h-4 w-4 shrink-0" />
              <p>
                <span className="font-semibold">Insight:</span>{" "}
                {topCategory && topCategory.total > 0
                  ? `${topCategory.name} memberi kontribusi terbesar (${topCategory.percent}%) hari ini.`
                  : "Belum ada transaksi hari ini."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stok perlu perhatian + Pesanan terbaru */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Stok Perlu Perhatian</CardTitle>
            <Link href="/stok" className="text-sm font-semibold text-primary hover:underline">
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Semua stok dalam kondisi aman. 🎉
              </p>
            ) : (
              <>
                {data.lowStock.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {p.imageUrl && (
                        <Image src={p.imageUrl} alt={p.name} fill unoptimized className="object-cover" sizes="44px" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.category.name} · Min {p.minStock}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-navy">{p.stock}</p>
                      <StockStatusBadge stock={p.stock} minStock={p.minStock} />
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-2 rounded-xl bg-brand-gold/10 p-3 text-xs text-[#8a5f12]">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p>
                    {data.lowStockTotal} produk berada di bawah stok minimum. Segera lakukan restock.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Pesanan Terbaru</CardTitle>
            <Link href="/pesanan" className="text-sm font-semibold text-primary hover:underline">
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada pesanan.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Bayar</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs font-semibold text-navy">
                        {o.orderNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {o.orderType === "DINE_IN"
                          ? `Meja ${o.tableNumber}`
                          : orderTypeLabel[o.orderType]}
                        <span className="block text-xs text-muted-foreground">
                          {formatTanggalWaktu(o.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">{formatRupiah(o.total)}</TableCell>
                      <TableCell className="text-xs">
                        {o.payment ? (
                          <Badge variant="muted">{paymentMethodLabel[o.payment.method]}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {session.user.role === "KASIR" && (
              <Link
                href="/kasir"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 py-2.5 text-sm font-semibold text-primary hover:bg-accent"
              >
                Buat Pesanan Baru <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  footer,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  footer: React.ReactNode;
  tone: "blue" | "violet" | "emerald" | "orange";
}) {
  const tones: Record<string, string> = {
    blue: "bg-primary/10 text-primary",
    violet: "bg-brand-terracotta/15 text-brand-terracotta",
    emerald: "bg-brand-leaf/15 text-brand-leaf",
    orange: "bg-brand-gold/15 text-brand-gold",
  };
  return (
    <Card className={cn(tone === "orange" && "border-brand-gold/30 bg-brand-gold/5")}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>
            {icon}
          </span>
        </div>
        <p className="mt-3 text-2xl font-extrabold text-navy">{value}</p>
        <div className="mt-2 flex items-center gap-1">{footer}</div>
      </CardContent>
    </Card>
  );
}
