"use client";

import {
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
import { formatRupiah, formatJuta } from "@/lib/utils";

// Makanan Utama = teal, Appetizer = terakota, Minuman = emas
const CAT_COLORS = ["#1F5C5B", "#B8653F", "#C9942E"];

function formatRupiahAxis(v: number): string {
  if (v >= 1_000_000) {
    const juta = v / 1_000_000;
    return `${Number.isInteger(juta) ? juta : juta.toFixed(1)}jt`;
  }
  if (v >= 1000) return `${Math.round(v / 1000)}rb`;
  return String(v);
}

export function WeeklyChart({
  data,
}: {
  data: { label: string; date: string; sales: number; orders: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DDC8" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#8A7A60" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v, i) => `${v} ${data[i]?.date ?? ""}`}
        />
        {/* Sumbu kiri: rupiah */}
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: "#8A7A60" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatRupiahAxis}
          width={52}
        />
        {/* Sumbu kanan: jumlah pesanan */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "#C9942E" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: "#F1E9D6" }}
          contentStyle={{ borderRadius: 12, border: "1px solid #E8DDC8", fontSize: 12 }}
          formatter={(value: number, name) =>
            name === "sales"
              ? [formatRupiah(value), "Penjualan"]
              : [`${value} pesanan`, "Jumlah Pesanan"]
          }
          labelFormatter={(label, payload) => `${label} ${payload?.[0]?.payload?.date ?? ""}`}
        />
        <Bar yAxisId="left" name="sales" dataKey="sales" fill="#1F5C5B" radius={[6, 6, 0, 0]} maxBarSize={20} />
        <Bar yAxisId="right" name="orders" dataKey="orders" fill="#C9942E" radius={[6, 6, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({
  data,
  total,
}: {
  data: { name: string; total: number; percent: number }[];
  total: number;
}) {
  const chartData = data.filter((d) => d.total > 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData.length ? chartData : [{ name: "Kosong", total: 1 }]}
            dataKey="total"
            nameKey="name"
            innerRadius={62}
            outerRadius={90}
            paddingAngle={chartData.length > 1 ? 3 : 0}
            stroke="none"
          >
            {(chartData.length ? chartData : [{ name: "Kosong" }]).map((_, i) => (
              <Cell key={i} fill={chartData.length ? CAT_COLORS[i % 3] : "#E8DDC8"} />
            ))}
          </Pie>
          {chartData.length > 0 && (
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #E8DDC8", fontSize: 12 }}
              formatter={(value: number) => formatRupiah(value)}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-muted-foreground">Total Hari Ini</span>
        <span className="text-lg font-extrabold text-navy">{formatJuta(total)}</span>
      </div>
    </div>
  );
}

export const CATEGORY_COLORS = CAT_COLORS;
