import { Store, Users, Database, KeyRound } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingsForm } from "./settings-form";
import { UserManagement } from "./user-management";
import { PasswordForm } from "./password-form";
import { DbTest } from "./db-test";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const session = await requireAdmin();

  let setting = await prisma.setting.findFirst();
  if (!setting) setting = await prisma.setting.create({ data: {} });

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Konfigurasi restoran, pengguna, dan sistem." />

      <Tabs defaultValue="restoran">
        <TabsList className="flex-wrap">
          <TabsTrigger value="restoran">
            <Store className="mr-1.5 h-4 w-4" /> Profil Restoran
          </TabsTrigger>
          <TabsTrigger value="pengguna">
            <Users className="mr-1.5 h-4 w-4" /> Kelola User
          </TabsTrigger>
          <TabsTrigger value="koneksi">
            <Database className="mr-1.5 h-4 w-4" /> Koneksi DB
          </TabsTrigger>
          <TabsTrigger value="keamanan">
            <KeyRound className="mr-1.5 h-4 w-4" /> Keamanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="restoran">
          <Card>
            <CardHeader>
              <CardTitle>Profil Restoran</CardTitle>
              <CardDescription>Data ini digunakan pada struk dan billing.</CardDescription>
            </CardHeader>
            <CardContent className="max-w-xl">
              <SettingsForm
                setting={{
                  restaurantName: setting.restaurantName,
                  tagline: setting.tagline,
                  address: setting.address,
                  phone: setting.phone,
                  taxPercent: setting.taxPercent,
                  servicePercent: setting.servicePercent,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pengguna">
          <Card>
            <CardHeader>
              <CardTitle>Kelola Pengguna</CardTitle>
              <CardDescription>Tambah, edit, hapus, atau reset password pengguna.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement
                currentUserId={session.user.id}
                users={users.map((u) => ({
                  id: u.id,
                  name: u.name,
                  username: u.username,
                  role: u.role,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="koneksi">
          <Card>
            <CardHeader>
              <CardTitle>Status Koneksi Database</CardTitle>
              <CardDescription>
                Verifikasi koneksi aplikasi ke database PostgreSQL.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-w-xl">
              <DbTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keamanan">
          <Card>
            <CardHeader>
              <CardTitle>Ganti Password</CardTitle>
              <CardDescription>Ubah password akun Anda sendiri.</CardDescription>
            </CardHeader>
            <CardContent className="max-w-xl">
              <PasswordForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
