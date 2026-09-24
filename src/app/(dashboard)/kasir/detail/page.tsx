import { requireCashier } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { KasirDetail } from "./kasir-detail";

export const dynamic = "force-dynamic";

export default async function KasirDetailPage() {
  await requireCashier();
  const setting = await prisma.setting.findFirst();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Pesanan"
        description="Periksa kembali pesanan sebelum melanjutkan ke pembayaran."
      />
      <KasirDetail
        taxPercent={setting?.taxPercent ?? 10}
        servicePercent={setting?.servicePercent ?? 5}
        brandName={setting?.restaurantName ?? "Dapur Bu Aina"}
      />
    </div>
  );
}
