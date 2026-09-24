# 🍲 Dapur Bu Aina — Sistem Manajemen Restoran

> *Citarasa Warisan Keluarga*

Aplikasi web manajemen restoran untuk **Tugas 3 – Uji Kompetensi Junior Programmer (Universitas
Gunadarma)**. Mencakup pemesanan (dine-in / take away), manajemen stok berbasis kriteria
(**Tugas 3a**), billing & pembayaran tunai/non-tunai (**Tugas 3b**), serta laporan penjualan
mingguan & bulanan.

## ✨ Fitur Utama
- 🔐 **Autentikasi & Role** — ADMIN & KASIR, proteksi route via middleware + verifikasi role di server. KASIR otomatis diarahkan ke halaman **Kasir** setelah login.
- 📊 **Dashboard** — statistik penjualan real-time, grafik 7 hari (dua sumbu Y: rupiah & jumlah pesanan), penjualan per kategori, stok perlu perhatian, indikator "Diperbarui X detik lalu".
- 🧑‍🍳 **Kasir / POS 4 Layar** — alur berurutan: **Pilih Menu → Detail Pesanan → Pembayaran → Transaksi Berhasil**. Keranjang bertahan antar layar (Zustand + sessionStorage), kartu "Meja Aktif" di sidebar, nomor transaksi `#TRX-YYYYMMDD-XXXX` (reset per hari), catatan pesanan.
- 📦 **Produk** — CRUD produk (admin), soft delete, validasi zod.
- 📥 **Stok Barang (Tugas 3a)** — filter kategori/status/pencarian (tersimpan di URL), input stok masuk & penyesuaian dalam transaksi database + riwayat.
- 🧾 **Billing & Pembayaran (Tugas 3b)** — tunai (hitung kembalian), Debit/Kredit/QRIS, dialog konfirmasi, cegah double-submit, cetak struk thermal 80mm. Pengurangan stok aman dari *race condition* (update bersyarat `stock >= qty`).
- 🔄 **Sinkronisasi Real-time** — polling `router.refresh()` tiap 5 detik (berhenti saat tab tidak aktif) + endpoint ringan `GET /api/realtime/summary`. Pesanan/pembayaran kasir langsung terlihat di dashboard admin, dan perubahan stok admin langsung tercermin di menu kasir — tanpa reload, cocok untuk Vercel (tanpa WebSocket/LISTEN-NOTIFY).
- 📈 **Laporan** — mingguan/bulanan, grafik tren & metode, export CSV, cetak PDF.
- ⚙️ **Pengaturan** — profil restoran, kelola user, ganti password, **tes koneksi database**.
- 💚 **Health Check** — `GET /api/health` membuktikan koneksi database + indikator online/offline.

## 🧑‍🍳 Alur Kasir (POS)
1. **`/kasir`** — pilih menu per kategori (produk habis abu-abu berlabel "Habis"), atur keranjang, pilih Dine In (meja) / Take Away (pelanggan), tulis catatan.
2. **`/kasir/detail`** — periksa & ubah qty, lihat ringkasan (subtotal, pajak, service, total). Klik lanjut → membuat Order `PENDING` + mengurangi stok dalam satu transaksi.
3. **`/kasir/pembayaran/[orderId]`** — pilih Tunai / QRIS / Debit-Kredit, konfirmasi → Order `PAID`.
4. **`/kasir/sukses/[orderId]`** — layar berhasil + preview struk + **Cetak Struk** + **Transaksi Baru**.

## 🛠️ Teknologi
| Kategori | Teknologi |
|----------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS, komponen ala shadcn/ui, lucide-react, Recharts |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js (NextAuth v5), Credentials, JWT, bcryptjs |
| Validasi | zod + react-hook-form |
| State keranjang | Zustand (persist ke sessionStorage) |
| Aset gambar | sharp (proses logo), next/image |
| Font | Fraunces (judul), Plus Jakarta Sans (body), Caveat (aksen tulisan tangan) |

## 🚀 Menjalankan Secara Lokal

### 1. Prasyarat
- Node.js 18+ dan npm
- PostgreSQL (lokal) atau connection string Neon

### 2. Install dependency
```bash
npm install
```
> Script `postinstall` otomatis menjalankan `prisma generate`.

### 3. Konfigurasi environment
Salin `.env.example` menjadi `.env`, lalu isi:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/dapur_ina_aina?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/dapur_ina_aina?schema=public"
AUTH_SECRET="..."   # generate dengan: npx auth secret
```
- **Lokal**: `DATABASE_URL` dan `DIRECT_URL` boleh sama.
- **Neon**: `DATABASE_URL` = koneksi pooled, `DIRECT_URL` = koneksi direct (untuk migrate).

### 4. Migrasi & seed database
```bash
npx prisma migrate deploy   # terapkan semua migrasi di prisma/migrations
npm run db:seed             # isi 3 kategori, 18 produk, 92 pesanan dummy
```

### 5. Jalankan
```bash
npm run dev       # mode development → http://localhost:3000
# atau
npm run build && npm run start   # mode production
```

### 6. Login
| Role | Username | Password |
|------|----------|----------|
| Administrator | `admin` | `admin123` |
| Kasir | `kasir` | `kasir123` |

> ⚠️ **Ganti password akun default setelah deploy.** (Pengaturan → Ganti Password / Kelola User)

## 📜 Script npm
| Script | Fungsi |
|--------|--------|
| `npm run dev` | Menjalankan server development |
| `npm run build` | `prisma generate` + build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | Menjalankan ESLint |
| `npm run db:seed` | Mengisi data awal |
| `npm run db:deploy` | `prisma migrate deploy` (produksi) |

## ☁️ Deploy ke Vercel
1. **Push** repository ke GitHub.
2. **Import** repo di [Vercel](https://vercel.com).
3. Tambah database **Postgres (Neon)** melalui **Vercel → Storage / Marketplace**, hubungkan ke project (otomatis mengisi `DATABASE_URL` & `DIRECT_URL`).
4. Set environment `AUTH_SECRET` (generate dengan `npx auth secret`).
5. Jalankan migrasi & seed ke database production:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```
   (dapat dijalankan lokal dengan `.env` menunjuk ke database production, atau via Vercel CLI).
6. Verifikasi koneksi dengan membuka `https://<domain-anda>/api/health` — harus mengembalikan `{"status":"ok","database":"connected"}`.
7. Login sebagai `admin`, lalu **ganti password akun default** (`admin` & `kasir`).

> Script `postinstall: prisma generate` sudah ditambahkan agar build di Vercel tidak gagal.

## 📁 Struktur Proyek
```
src/
├── app/
│   ├── (auth)/login/          # halaman login
│   ├── (dashboard)/           # layout sidebar + halaman aplikasi
│   │   ├── dashboard/ kasir/ produk/ stok/ pesanan/ pembayaran/ laporan/ pengaturan/ profil/ pencarian/
│   │   └── kasir/{detail, pembayaran/[orderId], sukses/[orderId]}   # POS 4 layar
│   ├── api/health/            # health check koneksi DB
│   ├── api/realtime/summary/  # ringkasan pending & stok menipis (polling)
│   ├── api/auth/[...nextauth]/# handler Auth.js
│   └── api/laporan/export/    # export CSV
├── actions/                   # Server Actions (mutasi + validasi + cek role)
├── components/                # UI, layout, komponen bersama (auto-refresh, confetti, dll)
├── hooks/                     # use-realtime-summary
├── store/                     # cart.ts (Zustand)
├── lib/                       # prisma, auth, utils, validations, reports
└── middleware.ts              # proteksi route + role
prisma/
├── schema.prisma              # skema database
└── seed.ts                    # data awal
docs/                          # dokumentasi tugas
```

## 📚 Dokumentasi Tugas
Seluruh dokumen ada di folder [`/docs`](./docs):
- [`docs/spesifikasi-program.md`](./docs/spesifikasi-program.md) — spesifikasi & hak akses
- [`docs/metode-pengembangan.md`](./docs/metode-pengembangan.md) — metode Waterfall
- [`docs/diagram.md`](./docs/diagram.md) — ERD, Use Case, Activity, Flowchart (Mermaid)
- [`docs/pengujian.md`](./docs/pengujian.md) — 42 skenario uji black box

## 🎨 Branding & Tema
- Identitas visual mengikuti logo **Dapur Bu Aina** — tema hangat tradisional (teal, emas, terakota, krem).
- Logo diproses dari gambar sumber dengan `npm run process-logo` (memakai `sharp`) → menghasilkan `public/brand/logo.png` (bulat transparan), `logo-sm.png`, favicon `src/app/icon.png`, `apple-icon.png`, dan `hero-kitchen.jpg` untuk background login.
- Nama restoran & tagline **dinamis** dari tabel `Setting` (dapat diubah admin di Pengaturan) dan dipakai di sidebar, header, login, sambutan, billing, struk, serta `<title>`.

## 📝 Catatan Keputusan Desain
- **Next.js 15 + `middleware.ts`** dipakai (bukan `proxy.ts`) karena versi ini memakai konvensi middleware standar.
- **Soft delete** produk (`isActive=false`) agar data historis pesanan tetap utuh.
- **Perhitungan tanggal** memakai zona waktu server; untuk produksi disarankan menyamakan zona ke Asia/Jakarta.
- **QRIS** menampilkan QR dummy (bukan gateway pembayaran nyata) sesuai kebutuhan tugas.
