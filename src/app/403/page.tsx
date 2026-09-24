import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-chili/15 text-brand-chili">
        <ShieldX className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-extrabold text-navy">403 — Akses Ditolak</h1>
      <p className="max-w-md text-muted-foreground">
        Halaman ini khusus untuk Administrator. Akun Anda tidak memiliki hak akses
        yang diperlukan.
      </p>
      <Button asChild>
        <Link href="/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}
