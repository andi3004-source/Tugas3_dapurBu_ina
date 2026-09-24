/**
 * Proses logo "Dapur Bu Aina" dari gambar sumber.
 * Menghasilkan: logo bulat transparan, versi kecil, favicon, apple-icon,
 * dan menyimpan gambar dapur utuh untuk background login.
 *
 * Jalankan: npx tsx scripts/process-logo.ts
 */
import sharp from "sharp";
import { mkdir, access, copyFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SRC_CANDIDATES = [
  path.join(ROOT, "src", "gambar_dapur_bu_aina.jpg"),
  path.join(ROOT, "public", "brand", "hero-kitchen.jpg"),
];
const BRAND_DIR = path.join(ROOT, "public", "brand");
const APP_DIR = path.join(ROOT, "src", "app");

// Koordinat crop lingkaran logo (diverifikasi terhadap gambar 1408x768)
const CROP = { left: 374, top: 54, size: 660 };
const CIRCLE = { cx: 330, cy: 330, r: 322 };

async function firstExisting(paths: string[]): Promise<string> {
  for (const p of paths) {
    try {
      await access(p);
      return p;
    } catch {
      /* lanjut */
    }
  }
  throw new Error(`Gambar sumber tidak ditemukan di: ${paths.join(", ")}`);
}

async function main() {
  const src = await firstExisting(SRC_CANDIDATES);
  await mkdir(BRAND_DIR, { recursive: true });

  // 1) Simpan gambar dapur utuh untuk background login
  const heroPath = path.join(BRAND_DIR, "hero-kitchen.jpg");
  try {
    await access(heroPath);
  } catch {
    await copyFile(src, heroPath);
  }
  console.log("✓ hero-kitchen.jpg");

  // 2) Crop lingkaran logo + mask transparan
  const circleMask = Buffer.from(
    `<svg width="${CROP.size}" height="${CROP.size}"><circle cx="${CIRCLE.cx}" cy="${CIRCLE.cy}" r="${CIRCLE.r}" fill="#fff"/></svg>`,
  );

  const circularLogo = await sharp(src)
    .extract({ left: CROP.left, top: CROP.top, width: CROP.size, height: CROP.size })
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  // logo.png (512px, transparan)
  await sharp(circularLogo).resize(512, 512).png().toFile(path.join(BRAND_DIR, "logo.png"));
  console.log("✓ logo.png (512)");

  // logo-sm.png (128px)
  await sharp(circularLogo).resize(128, 128).png().toFile(path.join(BRAND_DIR, "logo-sm.png"));
  console.log("✓ logo-sm.png (128)");

  // favicon app/icon.png (64px)
  await sharp(circularLogo).resize(64, 64).png().toFile(path.join(APP_DIR, "icon.png"));
  console.log("✓ app/icon.png (64)");

  // apple-icon app/apple-icon.png (180px, background krem agar tidak transparan di iOS)
  await sharp(circularLogo)
    .resize(164, 164)
    .extend({
      top: 8,
      bottom: 8,
      left: 8,
      right: 8,
      background: { r: 251, g: 246, b: 236, alpha: 1 },
    })
    .flatten({ background: { r: 251, g: 246, b: 236 } })
    .png()
    .toFile(path.join(APP_DIR, "apple-icon.png"));
  console.log("✓ app/apple-icon.png (180)");

  console.log("\n🎨 Logo selesai diproses ke public/brand/ dan src/app/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
