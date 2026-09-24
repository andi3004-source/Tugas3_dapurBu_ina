import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  BarChart3,
  Settings,
  Store,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  cashierOnly?: boolean;
  badge?: "pending";
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Kasir", href: "/kasir", icon: Store, cashierOnly: true },
  { label: "Pesanan", href: "/pesanan", icon: ShoppingCart, badge: "pending" },
  { label: "Produk", href: "/produk", icon: Package, adminOnly: true },
  { label: "Stok Barang", href: "/stok", icon: Boxes },
  { label: "Laporan", href: "/laporan", icon: BarChart3, adminOnly: true },
  { label: "Pengaturan", href: "/pengaturan", icon: Settings, adminOnly: true },
];

export function navForRole(role: "ADMIN" | "KASIR"): NavItem[] {
  return NAV_ITEMS.filter(
    (i) => (!i.adminOnly || role === "ADMIN") && (!i.cashierOnly || role === "KASIR"),
  );
}
