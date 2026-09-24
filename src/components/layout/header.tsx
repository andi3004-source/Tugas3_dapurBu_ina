"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/actions/auth";
import { formatTanggalPanjang, formatWaktu } from "@/lib/utils";
import { useRealtimeSummary } from "@/hooks/use-realtime-summary";

type Notif = { id: string; type: "stock" | "order"; title: string; description: string };

export function Header({
  user,
  notifications,
  pendingCount,
  lowStockCount,
}: {
  user: { name: string; username: string; role: "ADMIN" | "KASIR" };
  notifications: Notif[];
  pendingCount: number;
  lowStockCount: number;
}) {
  const router = useRouter();
  const summary = useRealtimeSummary({ pendingCount, lowStockCount });
  const [now, setNow] = useState<Date | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/pencarian?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <form onSubmit={submitSearch} className="relative hidden flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari pesanan, produk, atau menu..."
            className="pl-9"
          />
        </form>
        <div className="flex-1 sm:hidden" />

        <div className="hidden text-right text-xs md:block">
          <p className="font-semibold text-navy">
            {now ? formatTanggalPanjang(now) : "—"}
          </p>
          <p className="text-muted-foreground">
            {now ? `${formatWaktu(now)} WIB` : "—"}
          </p>
        </div>

        {/* Notifikasi */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-navy">
              <Bell className="h-5 w-5" />
              {summary.notifCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-chili px-1 text-xs font-bold text-white">
                  {summary.notifCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Tidak ada notifikasi baru.
              </p>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <div key={n.id} className="flex items-start gap-2 px-3 py-2">
                  <Badge variant={n.type === "stock" ? "warning" : "default"} className="mt-0.5">
                    {n.type === "stock" ? "Stok" : "Pesanan"}
                  </Badge>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.description}</p>
                  </div>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profil */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl border border-border bg-card py-1.5 pl-1.5 pr-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-none text-navy">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === "ADMIN" ? "Administrator" : "Kasir"}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  @{user.username}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profil")}>
              <UserIcon className="h-4 w-4" />
              Profil Saya
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutAction()}
              className="text-brand-chili focus:bg-brand-chili/10 focus:text-brand-chili"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
