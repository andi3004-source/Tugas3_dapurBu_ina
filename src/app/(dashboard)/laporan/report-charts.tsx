"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRupiah } from "@/lib/utils";

const COLORS = ["#1F5C5B", "#B8653F", "#C9942E", "#6E8B4A", "#7A4E2D"];

export function TrendChart({
  data,
}: {
  data: { label: string; sales: number; orders: number }[];
}) {
  if (data.length === 0)
    return <Empty>Tidak ada data penjualan pada periode ini.</Empty>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1F5C5B" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1F5C5B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DDC8" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8A7A60" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#8A7A60" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1_000_000 ? `${v / 1_000_000}jt` : `${v / 1000}rb`)}
          width={44}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #E8DDC8", fontSize: 12 }}
          formatter={(v: number) => [formatRupiah(v), "Penjualan"]}
        />
        <Area type="monotone" dataKey="sales" stroke="#1F5C5B" strokeWidth={2} fill="url(#sales)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBar({ data }: { data: { name: string; total: number }[] }) {
  const has = data.some((d) => d.total > 0);
  if (!has) return <Empty>Belum ada penjualan per kategori.</Empty>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: "#16403F" }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #E8DDC8", fontSize: 12 }}
          formatter={(v: number) => [formatRupiah(v), "Penjualan"]}
        />
        <Bar dataKey="total" radius={[0, 8, 8, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MethodDonut({
  data,
}: {
  data: { label: string; total: number; count: number }[];
}) {
  const chartData = data.filter((d) => d.total > 0);
  if (chartData.length === 0) return <Empty>Belum ada data metode pembayaran.</Empty>;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={200} className="max-w-[220px]">
        <PieChart>
          <Pie data={chartData} dataKey="total" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #E8DDC8", fontSize: 12 }}
            formatter={(v: number) => formatRupiah(v)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="w-full space-y-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-navy">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {d.label}
            </span>
            <span className="text-muted-foreground">
              {d.count}× · {formatRupiah(d.total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
