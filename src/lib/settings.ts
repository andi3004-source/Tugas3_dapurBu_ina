import { prisma } from "@/lib/prisma";

export type RestaurantSetting = {
  restaurantName: string;
  tagline: string;
  address: string;
  phone: string;
  taxPercent: number;
  servicePercent: number;
};

const DEFAULTS: RestaurantSetting = {
  restaurantName: "Dapur Bu Aina",
  tagline: "Citarasa Warisan Keluarga",
  address: "Jl. Margonda Raya No. 100, Depok, Jawa Barat",
  phone: "021-7888999",
  taxPercent: 10,
  servicePercent: 5,
};

/** Ambil pengaturan restoran (nama, tagline, dll). Selalu mengembalikan nilai default bila kosong. */
export async function getSetting(): Promise<RestaurantSetting> {
  try {
    const s = await prisma.setting.findFirst();
    if (!s) return DEFAULTS;
    return {
      restaurantName: s.restaurantName,
      tagline: s.tagline,
      address: s.address,
      phone: s.phone,
      taxPercent: s.taxPercent,
      servicePercent: s.servicePercent,
    };
  } catch {
    return DEFAULTS;
  }
}
