import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { formatTanggalPanjang } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PasswordForm } from "@/app/(dashboard)/pengaturan/password-form";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader title="Profil Saya" description="Informasi akun dan keamanan." />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-bold text-navy">{user.name}</p>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
            <Badge variant={user.role === "ADMIN" ? "default" : "muted"}>
              {user.role === "ADMIN" ? "Administrator" : "Kasir"}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">
              Bergabung {formatTanggalPanjang(user.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ganti Password</CardTitle>
            <CardDescription>Perbarui password akun Anda secara berkala.</CardDescription>
          </CardHeader>
          <CardContent className="max-w-lg">
            <PasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
