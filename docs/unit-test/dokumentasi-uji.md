# Dokumentasi Uji Unit — Dapur Bu Aina (Tugas 4)

Dokumen ini mencatat pengujian unit terhadap logika program sistem manajemen restoran **Dapur Bu Aina**:
kebutuhan uji, skenario, data uji, hasil, ringkasan, dan evaluasi. Semua hasil diambil dari output asli
terminal yang tersimpan di [`hasil-test.txt`](./hasil-test.txt), [`coverage.txt`](./coverage.txt), dan
[`hasil-test-sebelum-perbaikan.txt`](./hasil-test-sebelum-perbaikan.txt).

## 1. Kebutuhan Uji Coba

### 1.1 Tujuan
1. Memastikan setiap unit logika bisnis (stok, billing, pembayaran, nomor transaksi, hak akses, laporan) menghasilkan keluaran yang benar untuk input normal, input batas (*boundary*), dan input salah (*negative test*).
2. Menemukan bug sebelum sampai ke pengguna, memperbaikinya, dan membuktikan perbaikan dengan uji ulang.
3. Mengukur cakupan kode (*code coverage*) unit yang diuji.

### 1.2 Lingkup unit
| No | Unit | Fungsi yang diuji |
| --- | --- | --- |
| U1 | Status stok | `src/lib/stock.ts` → `getStockStatus`, `stockStatusLabel` |
| U2 | Hitung billing | `src/lib/billing.ts` → `calculateBilling`, `calculateCharges`, `lineSubtotal`; `src/actions/orders.ts` → `createOrder` |
| U3 | Pembayaran tunai | `src/lib/billing.ts` → `calculateCashPayment`, `validatePaymentInput`; `src/actions/payments.ts` → `confirmPayment` |
| U4 | Validasi non tunai | `src/lib/validations.ts` → `paymentSchema`; `src/lib/billing.ts` → `validatePaymentInput` |
| U5 | Validasi stok pesanan | `src/lib/stock.ts` → `validateOrderStock`; `orderSchema`; `createOrder` |
| U6 | Update/penyesuaian stok | `src/lib/stock.ts` → `calculateStockAdjustment`, `calculateStockIn`; `stockAdjustSchema`, `stockInSchema`; `src/actions/stock.ts` → `stockAdjust` |
| U7 | Validasi form produk (zod) | `src/lib/validations.ts` → `productSchema` |
| U8 | Nomor transaksi | `src/lib/order-number.ts` → `formatOrderNumber`, `orderDayRange` |
| U9 | Format rupiah & tanggal | `src/lib/utils.ts` → `formatRupiah`, `formatNumber`, `formatJuta`, `formatTanggalPanjang`, `formatTanggalWaktu`, `formatWaktu`, `persen` |
| U10 | Hak akses role | `src/lib/access.ts` → `resolveAccess` (dipakai `src/middleware.ts`); `src/lib/nav.ts` → `navForRole` |
| U11 | Laporan periode | `src/lib/period.ts` → `isoWeekToRange`, `monthToRange`, `summarizeRevenue`, `buildDailyTrend`; `src/lib/reports.ts` → `getReport` |

Logika yang sebelumnya tercampur di komponen/server action dipindahkan ke fungsi murni di `src/lib/`
(`billing.ts`, `stock.ts`, `order-number.ts`, `access.ts`, `period.ts`, `timezone.ts`), lalu dipakai kembali di
tempat asalnya (`actions/orders.ts`, `actions/payments.ts`, `actions/stock.ts`, `middleware.ts`, `lib/reports.ts`,
halaman kasir/billing/POS). Perilaku aplikasi tidak berubah, kecuali dua bug yang ditemukan dan diperbaiki (bagian 6).

Di luar lingkup: tampilan komponen React (UI), koneksi database sungguhan, dan alur login NextAuth.
Server action diuji dengan **Prisma di-mock** (`vi.mock("@/lib/prisma")`), jadi tidak ada database asli yang disentuh.

### 1.3 Perangkat lunak & versi
| Perangkat | Versi |
| --- | --- |
| Sistem operasi | Windows 11 Home Single Language 10.0.26200 |
| Node.js | v24.18.0 |
| Vitest | 5.0.1 (`@vitest/coverage-v8` 5.0.1, provider v8) |
| TypeScript | 5.9.3 |
| Next.js | 15.5.26 |
| Zod | 3.25.76 |
| Zona waktu saat test | `TZ=UTC` (diset di `vitest.config.ts`, sama dengan server Vercel) |

### 1.4 Cara menjalankan
```bash
npm test               # vitest run --reporter=verbose
npm run test:coverage  # vitest run --coverage
```
File test ada di `src/__tests__/*.test.ts` (satu file per unit), data uji di `src/__tests__/fixtures.ts`.
Test tidak dijalankan saat build Vercel: script `build` tetap `prisma generate && next build`, dan folder test
dimasukkan ke `.vercelignore`.

## 2. Skenario Uji Coba

Jenis: **Normal** = kasus umum, **Batas** = nilai di tepi aturan (*boundary*), **Salah** = input tidak valid (*negative test*).

| ID | Unit | Skenario | Jenis |
| --- | --- | --- | --- |
| U1-01 | Status stok | Jus Alpukat stok 0 / min 10 berstatus Habis | Normal |
| U1-02 | Status stok | Es Jeruk stok 8 / min 20 berstatus Hampir Habis | Normal |
| U1-03 | Status stok | Air Mineral stok 200 / min 30 berstatus Aman | Normal |
| U1-04 | Status stok | stok sama dengan minimum (20/20) berstatus Hampir Habis | Batas |
| U1-05 | Status stok | stok minimum + 1 (21/20) berstatus Aman | Batas |
| U1-06 | Status stok | stok 1 (di atas nol) dengan min 10 berstatus Hampir Habis | Batas |
| U1-07 | Status stok | stok minimum 0: stok 0 Habis, stok 1 Aman | Batas |
| U1-08 | Status stok | stok negatif (-1) tetap dianggap Habis | Salah |
| U1-09 | Status stok | label status berbahasa Indonesia sesuai tampilan | Normal |
| U2-01 | Hitung billing | menghitung total billing Meja 12 = 42.550 | Normal |
| U2-02 | Hitung billing | subtotal item = harga × qty (Ayam Bakar Madu × 2 = 64.000) | Normal |
| U2-03 | Hitung billing | billing banyak qty: 2 Ayam Bakar Madu + 3 Air Mineral = 90.850 | Normal |
| U2-04 | Hitung billing | pajak 0% dan service 0% → total sama dengan subtotal | Batas |
| U2-05 | Hitung billing | keranjang kosong → semua komponen 0 | Batas |
| U2-06 | Hitung billing | pembulatan rupiah: subtotal 12.345 → pajak 1.235, service 617 | Batas |
| U2-07 | Hitung billing | pajak 100% (maksimum pengaturan) menggandakan subtotal | Batas |
| U2-08 | Hitung billing | createOrder menyimpan subtotal 37.000, pajak 3.700, service 1.850, total 42.550 | Normal |
| U2-09 | Hitung billing | Dine In tanpa nomor meja ditolak sebelum menyentuh database | Salah |
| U3-01 | Pembayaran tunai | uang Rp0 → uang kurang, kekurangan Rp42.550 | Salah |
| U3-02 | Pembayaran tunai | uang Rp42.549 (kurang 1 rupiah) → uang kurang | Batas |
| U3-03 | Pembayaran tunai | uang pas Rp42.550 → kembalian Rp0 | Batas |
| U3-04 | Pembayaran tunai | uang Rp50.000 → kembalian Rp7.450 | Normal |
| U3-05 | Pembayaran tunai | validasi kasir: tunai kurang → CASH_SHORT, tunai pas → lolos | Normal |
| U3-06 | Pembayaran tunai | skema pembayaran menolak nominal negatif | Salah |
| U3-07 | Pembayaran tunai | uang Rp42.549 ditolak & pembayaran tidak disimpan | Salah |
| U3-08 | Pembayaran tunai | uang Rp50.000 disimpan dengan kembalian Rp7.450 dan status Lunas | Normal |
| U3-09 | Pembayaran tunai | pesanan yang sudah Lunas tidak bisa dibayar dua kali | Salah |
| U4-01 | Validasi non tunai | QRIS dengan nomor referensi diterima | Normal |
| U4-02 | Validasi non tunai | QRIS tanpa nomor referensi ditolak | Salah |
| U4-03 | Validasi non tunai | QRIS dengan nomor referensi berisi spasi saja ditolak | Salah |
| U4-04 | Validasi non tunai | Kartu Debit dengan 4 digit terakhir 1234 diterima | Normal |
| U4-05 | Validasi non tunai | Kartu Debit 3 digit (123) dan 5 digit (12345) ditolak | Batas |
| U4-06 | Validasi non tunai | Kartu Kredit dengan huruf (12a4) ditolak | Salah |
| U4-07 | Validasi non tunai | Kartu Kredit tanpa 4 digit terakhir ditolak | Salah |
| U4-08 | Validasi non tunai | Kartu Kredit 4 digit valid diterima (nomor referensi opsional) | Normal |
| U4-09 | Validasi non tunai | tunai tidak memerlukan nomor referensi maupun 4 digit kartu | Normal |
| U4-10 | Validasi non tunai | metode pembayaran tidak dikenal (OVO) ditolak | Salah |
| U5-01 | Validasi stok pesanan | pesan 2 Es Jeruk dari stok 8 diterima | Normal |
| U5-02 | Validasi stok pesanan | qty sama dengan stok (8 Es Jeruk dari stok 8) diterima | Batas |
| U5-03 | Validasi stok pesanan | qty stok + 1 (9 Es Jeruk dari stok 8) ditolak | Batas |
| U5-04 | Validasi stok pesanan | pesan Jus Alpukat yang stoknya 0 ditolak | Salah |
| U5-05 | Validasi stok pesanan | qty 0 ditolak oleh skema pesanan dan fungsi validasi | Batas |
| U5-06 | Validasi stok pesanan | qty negatif (-1) ditolak oleh skema pesanan | Salah |
| U5-07 | Validasi stok pesanan | pesanan tanpa item ditolak dengan pesan 'Minimal 1 item' | Salah |
| U5-08 | Validasi stok pesanan | produk yang tidak ada / nonaktif ditolak | Salah |
| U5-09 | Validasi stok pesanan | banyak item: satu item kurang stok membuat seluruh pesanan ditolak | Normal |
| U5-10 | Validasi stok pesanan | pesan 9 Es Jeruk (stok 8) → gagal, stok & pesanan tidak diubah | Salah |
| U5-11 | Validasi stok pesanan | stok habis karena pesanan lain (race) → updateMany 0 baris, pesanan ditolak | Salah |
| U6-01 | Update/penyesuaian stok | Air Mineral 150 → 200 menghasilkan selisih +50 | Normal |
| U6-02 | Update/penyesuaian stok | penyesuaian turun 200 → 150 menghasilkan selisih -50 | Normal |
| U6-03 | Update/penyesuaian stok | stok baru 0 diterima (selisih -150) | Batas |
| U6-04 | Update/penyesuaian stok | stok baru sama dengan stok lama → selisih 0 | Batas |
| U6-05 | Update/penyesuaian stok | stok baru -1 ditolak | Salah |
| U6-06 | Update/penyesuaian stok | alasan penyesuaian kosong / hanya spasi ditolak | Salah |
| U6-07 | Update/penyesuaian stok | alasan 200 karakter diterima, 201 karakter ditolak | Batas |
| U6-08 | Update/penyesuaian stok | stok baru kosong (tidak diisi) ditolak | Salah |
| U6-09 | Update/penyesuaian stok | stok masuk 150 + 50 = 200 | Normal |
| U6-10 | Update/penyesuaian stok | stok masuk 0 ditolak, stok masuk 1 diterima | Batas |
| U6-11 | Update/penyesuaian stok | penyesuaian Air Mineral 150 → 200 mencatat ADJUSTMENT +50 | Normal |
| U6-12 | Update/penyesuaian stok | penyesuaian ke -1 ditolak tanpa menyentuh database | Salah |
| U7-01 | Validasi form produk (zod) | data produk lengkap diterima dan angka string dikonversi ke number | Normal |
| U7-02 | Validasi form produk (zod) | kode, nama, kategori, dan satuan kosong ditolak dengan pesan wajib | Salah |
| U7-03 | Validasi form produk (zod) | nama berisi spasi saja ditolak (di-trim) | Salah |
| U7-04 | Validasi form produk (zod) | harga 0 ditolak, harga 1 diterima | Batas |
| U7-05 | Validasi form produk (zod) | harga negatif ditolak | Salah |
| U7-06 | Validasi form produk (zod) | harga desimal (1500.5) ditolak karena rupiah bulat | Salah |
| U7-07 | Validasi form produk (zod) | stok 0 diterima, stok -1 ditolak | Batas |
| U7-08 | Validasi form produk (zod) | stok minimum negatif ditolak | Salah |
| U7-09 | Validasi form produk (zod) | stok berupa teks (abc) ditolak | Salah |
| U7-10 | Validasi form produk (zod) | URL gambar https diterima, ftp ditolak | Normal |
| U8-01 | Nomor transaksi | pesanan pertama 25 Sep 2026 bernomor #TRX-20260925-0001 | Normal |
| U8-02 | Nomor transaksi | urutan melanjutkan jumlah pesanan hari itu (41 pesanan → 0042) | Normal |
| U8-03 | Nomor transaksi | urutan ke-9999 tetap 4 digit | Batas |
| U8-04 | Nomor transaksi | format sesuai pola #TRX-YYYYMMDD-XXXX | Normal |
| U8-05 | Nomor transaksi | bulan & tanggal satu digit diberi nol di depan (5 Jan 2026 → 20260105) | Normal |
| U8-06 | Nomor transaksi | pesanan 00:30 WIB 25 Sep memakai tanggal 20260925 (bukan tanggal UTC 24 Sep) | Batas |
| U8-07 | Nomor transaksi | pesanan 23:59 WIB 24 Sep masih memakai tanggal 20260924 | Batas |
| U8-08 | Nomor transaksi | rentang hitung urutan harian = 00:00–23:59:59.999 WIB | Normal |
| U8-09 | Nomor transaksi | pesanan 00:30 WIB dihitung di hari yang sama dengan pesanan 14:00 WIB | Batas |
| U9-01 | Format rupiah & tanggal | total Meja 12 diformat Rp 42.550 | Normal |
| U9-02 | Format rupiah & tanggal | nol diformat Rp 0 | Batas |
| U9-03 | Format rupiah & tanggal | pecahan dibulatkan ke rupiah terdekat (1.234,6 → Rp 1.235) | Batas |
| U9-04 | Format rupiah & tanggal | nilai null/undefined tidak error, tampil Rp 0 | Salah |
| U9-05 | Format rupiah & tanggal | angka ribuan & juta memakai pemisah titik id-ID | Normal |
| U9-06 | Format rupiah & tanggal | tanggal panjang zona Asia/Jakarta: Rabu, 23 September 2026 | Normal |
| U9-07 | Format rupiah & tanggal | 17:00 UTC = 00:00 WIB sudah berganti ke Kamis, 24 September 2026 | Batas |
| U9-08 | Format rupiah & tanggal | tanggal+waktu dan waktu memakai jam WIB (07:32 UTC → 14.32) | Normal |
| U9-09 | Format rupiah & tanggal | persentase perubahan: naik 10%, dari 0 ke >0 = 100%, 0 ke 0 = 0% | Normal |
| U10-01 | Hak akses role | ADMIN boleh membuka /produk, /laporan, /pengaturan | Normal |
| U10-02 | Hak akses role | KASIR membuka halaman khusus ADMIN diarahkan ke /403 | Salah |
| U10-03 | Hak akses role | sub-route admin (/laporan/mingguan) juga terlindungi | Batas |
| U10-04 | Hak akses role | KASIR boleh membuka /kasir, /pembayaran, /pesanan/baru | Normal |
| U10-05 | Hak akses role | ADMIN membuka halaman operasional kasir diarahkan ke /403 | Salah |
| U10-06 | Hak akses role | halaman bersama (/dashboard, /pesanan, /stok) boleh untuk kedua role | Normal |
| U10-07 | Hak akses role | route berawalan mirip (/produktif, /pesanan/baruan) tidak ikut terkunci | Batas |
| U10-08 | Hak akses role | belum login diarahkan ke /login dengan callbackUrl | Salah |
| U10-09 | Hak akses role | sudah login membuka /login atau / diarahkan ke /dashboard | Normal |
| U10-10 | Hak akses role | sesi tanpa role tidak bisa membuka halaman ADMIN maupun KASIR | Salah |
| U10-11 | Hak akses role | menu sidebar sesuai aturan akses tiap role | Normal |
| U11-01 | Laporan periode | minggu 2026-W39 = Senin 21 Sep 00:00 WIB s.d. Minggu 27 Sep 23:59:59 WIB | Normal |
| U11-02 | Laporan periode | minggu 2027-W01 dimulai Senin 4 Jan 2027 (1 Jan jatuh hari Jumat) | Batas |
| U11-03 | Laporan periode | minggu 2026-W53 melewati pergantian tahun (28 Des 2026 – 3 Jan 2027) | Batas |
| U11-04 | Laporan periode | bulan 2026-09 = 1 Sep 00:00 WIB s.d. 30 Sep 23:59:59 WIB, label September 2026 | Normal |
| U11-05 | Laporan periode | Februari tahun kabisat 2028 berakhir tanggal 29 | Batas |
| U11-06 | Laporan periode | format periode tidak valid jatuh ke minggu ke-1 tahun berjalan | Salah |
| U11-07 | Laporan periode | penjumlahan pendapatan 3 pesanan contoh = Rp105.800, rata-rata Rp35.267 | Normal |
| U11-08 | Laporan periode | periode tanpa transaksi → pendapatan 0 dan rata-rata 0 (tanpa bagi nol) | Batas |
| U11-09 | Laporan periode | tren harian dikelompokkan per tanggal WIB (pesanan 01:00 WIB 23 Sep) | Batas |
| U11-10 | Laporan periode | laporan minggu 2026-W39: filter status PAID dalam rentang minggu, total Rp105.800 | Normal |
| U11-11 | Laporan periode | rekap per kategori & per metode pembayaran dari data contoh | Normal |

Komposisi: 43 normal, 34 batas, 33 salah (total 110 kasus).

## 3. Data Uji

Data uji sama dengan data aplikasi (`prisma/seed.ts`, pajak 10%, service 5%) dan disimpan di
`src/__tests__/fixtures.ts`. Data utama:

- **Billing Meja 12:** Ayam Bakar Madu Rp32.000 + Air Mineral Rp5.000 → subtotal 37.000, pajak 3.700, service 1.850, total **42.550**
- **Tunai:** Rp0 (kurang), Rp42.549 (kurang 1 rupiah), Rp42.550 (pas, kembalian 0), Rp50.000 (kembalian 7.450)
- **Stok:** Es Jeruk 8/min 20, Air Mineral 200/min 30, Jus Alpukat 0/min 10; batas 20/20 dan 21/20
- **Update stok:** Air Mineral 150 → 200 (selisih +50); stok baru -1 (ditolak)
- **Laporan:** 3 pesanan lunas September 2026 (Rp42.550 tunai, Rp46.000 QRIS, Rp17.250 debit) = Rp105.800

| ID | Input | Hasil yang diharapkan |
| --- | --- | --- |
| U1-01 | stok 0, min 10 (Jus Alpukat) | HABIS |
| U1-02 | stok 8, min 20 (Es Jeruk) | HAMPIR_HABIS |
| U1-03 | stok 200, min 30 (Air Mineral) | AMAN |
| U1-04 | stok 20, min 20 | HAMPIR_HABIS |
| U1-05 | stok 21, min 20 | AMAN |
| U1-06 | stok 1, min 10 | HAMPIR_HABIS |
| U1-07 | stok 0/min 0; stok 1/min 0 | HABIS; AMAN |
| U1-08 | stok -1, min 10 | HABIS |
| U1-09 | objek `stockStatusLabel` | Aman / Hampir Habis / Habis |
| U2-01 | Ayam Bakar Madu 32.000 ×1 + Air Mineral 5.000 ×1, pajak 10%, service 5% | subtotal 37.000, pajak 3.700, service 1.850, total 42.550 |
| U2-02 | harga 32.000, qty 2 | 64.000 |
| U2-03 | 32.000 ×2 + 5.000 ×3, 10%/5% | subtotal 79.000, pajak 7.900, service 3.950, total 90.850 |
| U2-04 | item Meja 12, pajak 0%, service 0% | total 37.000 |
| U2-05 | keranjang kosong `[]` | semua 0 |
| U2-06 | subtotal 12.345, 10%/5% | pajak 1.235, service 617, total 14.197 |
| U2-07 | subtotal 37.000, pajak 100%, service 0% | total 74.000 |
| U2-08 | `createOrder` Dine In meja 12 (Prisma mock, 25 Sep 2026 14:00 WIB) | order tersimpan 37.000/3.700/1.850/42.550, nomor `#TRX-20260925-0001` |
| U2-09 | `createOrder` Dine In, nomor meja `"  "` | `Nomor meja wajib diisi untuk Dine In.`, transaksi DB tidak dijalankan |
| U3-01 | total 42.550, uang 0 | uang kurang, kekurangan 42.550 |
| U3-02 | total 42.550, uang 42.549 | uang kurang, kekurangan 1 |
| U3-03 | total 42.550, uang 42.550 | cukup, kembalian 0 |
| U3-04 | total 42.550, uang 50.000 | cukup, kembalian 7.450 |
| U3-05 | CASH 42.549; CASH 42.550 | `CASH_SHORT`; lolos (null) |
| U3-06 | `amountPaid: -1` | ditolak skema |
| U3-07 | `confirmPayment` CASH 42.549 | `Uang tunai kurang dari total tagihan.`, payment tidak dibuat |
| U3-08 | `confirmPayment` CASH 50.000 | payment amountPaid 50.000, change 7.450, order → PAID |
| U3-09 | `confirmPayment` pesanan berstatus PAID | `Pesanan ini sudah dibayar.` |
| U4-01 | QRIS, ref `QR20260925001` | diterima |
| U4-02 | QRIS tanpa ref | `Nomor referensi wajib diisi` / `QRIS_REF_REQUIRED` |
| U4-03 | QRIS, ref `"   "` | ditolak |
| U4-04 | DEBIT, kartu `1234` | diterima |
| U4-05 | DEBIT, kartu `123` dan `12345` | `4 digit terakhir kartu wajib diisi` / `CARD_LAST4_INVALID` |
| U4-06 | CREDIT_CARD, kartu `12a4` | ditolak |
| U4-07 | CREDIT_CARD tanpa kartu | ditolak |
| U4-08 | CREDIT_CARD, kartu `9876` | diterima |
| U4-09 | CASH tanpa ref/kartu | diterima |
| U4-10 | method `OVO` | ditolak skema |
| U5-01 | Es Jeruk qty 2 (stok 8) | lolos (null) |
| U5-02 | Es Jeruk qty 8 (stok 8) | lolos (null) |
| U5-03 | Es Jeruk qty 9 (stok 8) | `Stok Es Jeruk tidak cukup (sisa 8).` |
| U5-04 | Jus Alpukat qty 1 (stok 0) | `Stok Jus Alpukat tidak cukup (sisa 0).` |
| U5-05 | Air Mineral qty 0 | ditolak skema & fungsi |
| U5-06 | Air Mineral qty -1 | ditolak skema |
| U5-07 | `items: []` | `Minimal 1 item` |
| U5-08 | produk `p-tidak-ada`; Menu Lama (nonaktif) | `Produk tidak ditemukan.`; `Menu Lama tidak aktif.` |
| U5-09 | Air Mineral 5 + Es Jeruk 10 | `Stok Es Jeruk tidak cukup (sisa 8).` |
| U5-10 | `createOrder` Es Jeruk qty 9 (Prisma mock) | gagal, stok & order tidak diubah |
| U5-11 | `createOrder` qty 2, `updateMany` count 0 (sisa 1) | `Stok Es Jeruk tidak cukup, sisa 1.` |
| U6-01 | Air Mineral 150 → 200 | selisih +50, stok akhir 200 |
| U6-02 | 200 → 150 | selisih -50 |
| U6-03 | 150 → 0 | diterima, selisih -150 |
| U6-04 | 150 → 150 | selisih 0 |
| U6-05 | 150 → -1 | `Stok baru tidak boleh negatif` |
| U6-06 | alasan `""` dan `"   "` | `Alasan penyesuaian wajib diisi` |
| U6-07 | alasan 200 dan 201 karakter | 200 diterima, 201 ditolak |
| U6-08 | `newStock: ""` (kosong) | ditolak |
| U6-09 | stok masuk 150 + 50 | stok akhir 200 |
| U6-10 | stok masuk qty 0; qty 1 | 0 ditolak; 1 diterima |
| U6-11 | `stockAdjust` Air Mineral 150 → "200" (Prisma mock) | movement ADJUSTMENT +50, 150 → 200 |
| U6-12 | `stockAdjust` newStock -1 | `Stok baru tidak boleh negatif`, DB tidak disentuh |
| U7-01 | produk lengkap (harga "28000", stok "25") | valid, angka dikonversi ke number |
| U7-02 | kode, nama, kategori, satuan kosong | 4 pesan wajib diisi |
| U7-03 | nama `"    "` | `Nama produk wajib diisi` |
| U7-04 | harga 0; harga 1 | 0 ditolak; 1 diterima |
| U7-05 | harga -32.000 | `Harga harus lebih dari 0` |
| U7-06 | harga 1500.5 | ditolak |
| U7-07 | stok 0; stok -1 | 0 diterima; -1 `Stok tidak boleh negatif` |
| U7-08 | stok minimum -1 | `Stok minimum tidak boleh negatif` |
| U7-09 | stok `"abc"` | ditolak |
| U7-10 | URL https; URL ftp | https diterima; ftp ditolak |
| U8-01 | 25 Sep 2026 14:00 WIB, 0 pesanan | `#TRX-20260925-0001` |
| U8-02 | 25 Sep 2026, 41 pesanan | `#TRX-20260925-0042` |
| U8-03 | 25 Sep 2026, 9.998 pesanan | `#TRX-20260925-9999` |
| U8-04 | 25 Sep 2026, 6 pesanan | cocok regex `^#TRX-\d{8}-\d{4}$` |
| U8-05 | 5 Jan 2026 10:00 WIB | `#TRX-20260105-0001` |
| U8-06 | 25 Sep 2026 00:30 WIB (24 Sep 17:30 UTC) | `#TRX-20260925-0001` |
| U8-07 | 24 Sep 2026 23:59 WIB, 3 pesanan | `#TRX-20260924-0004` |
| U8-08 | 25 Sep 2026 14:00 WIB | rentang 2026-09-24T17:00:00.000Z – 2026-09-25T16:59:59.999Z |
| U8-09 | 00:30 WIB vs 14:00 WIB tanggal 25 Sep | awal rentang sama |
| U9-01 | 42550 | `Rp 42.550` |
| U9-02 | 0 | `Rp 0` |
| U9-03 | 1234.6 | `Rp 1.235` |
| U9-04 | null / undefined | `Rp 0` |
| U9-05 | 1234567; 4280000 | `1.234.567`; `4,28 jt` |
| U9-06 | 2026-09-23T03:00Z | `Rabu, 23 September 2026` |
| U9-07 | 2026-09-23T16:59:59Z; 17:00:00Z | `Rabu, 23 September 2026`; `Kamis, 24 September 2026` |
| U9-08 | 2026-09-23T07:32Z | `23 Sep 2026, 14.32`; `14.32` |
| U9-09 | (110,100); (5,0); (0,0) | 10; 100; 0 |
| U10-01 | ADMIN → /produk, /laporan, /pengaturan | lanjut (next) |
| U10-02 | KASIR → /produk, /laporan, /pengaturan | redirect /403 |
| U10-03 | KASIR → /laporan/mingguan | redirect /403 |
| U10-04 | KASIR → /kasir, /kasir/detail, /pembayaran, /pesanan/baru | lanjut |
| U10-05 | ADMIN → /kasir, /pembayaran, /pesanan/baru | redirect /403 |
| U10-06 | ADMIN & KASIR → /dashboard, /pesanan, /pesanan/abc/billing, /stok | lanjut |
| U10-07 | KASIR → /produktif; ADMIN → /pesanan/baruan | lanjut |
| U10-08 | belum login → /stok, /, /login | /login?callbackUrl=/stok; /login; lanjut |
| U10-09 | sudah login → /login, / | redirect /dashboard |
| U10-10 | login tanpa role → /produk, /kasir | redirect /403 |
| U10-11 | `navForRole` ADMIN & KASIR | ADMIN 6 menu (tanpa Kasir); KASIR: Dashboard, Kasir, Pesanan, Stok |
| U11-01 | `2026-W39` | 2026-09-20T17:00:00.000Z – 2026-09-27T16:59:59.999Z (Sen 21 – Min 27 Sep WIB) |
| U11-02 | `2027-W01` | mulai 2027-01-03T17:00:00.000Z (Sen 4 Jan WIB) |
| U11-03 | `2026-W53` | 2026-12-27T17:00:00.000Z – 2027-01-03T16:59:59.999Z |
| U11-04 | `2026-09` | 2026-08-31T17:00:00.000Z – 2026-09-30T16:59:59.999Z, label `September 2026` |
| U11-05 | `2028-02` | akhir 2028-02-29T16:59:59.999Z |
| U11-06 | `minggu-ini` (format salah) | label `Minggu ke-1, <tahun berjalan>` |
| U11-07 | 3 pesanan: 42.550 + 46.000 + 17.250 | pendapatan 105.800, 3 transaksi, rata-rata 35.267 |
| U11-08 | tanpa pesanan | 0 / 0 / 0 |
| U11-09 | 3 pesanan, satu pukul 01:00 WIB 23 Sep | 21 Sep: 88.550 (2); 23 Sep: 17.250 (1) |
| U11-10 | `getReport` weekly 2026-W39 (Prisma mock) | filter PAID + rentang WIB; total 105.800; terlaris Air Mineral |
| U11-11 | `getReport` monthly 2026-09 (Prisma mock) | kategori: Makanan Utama 64.000, Minuman 28.000; metode: CASH 42.550, DEBIT 17.250, QRIS 46.000 |

## 4. Hasil Uji

Hasil dari `npm test` setelah perbaikan bug (lihat [`hasil-test.txt`](./hasil-test.txt); run dimulai 08:50:35 UTC,
durasi 466ms). Kolom "Sebelum perbaikan" diambil dari run pertama
([`hasil-test-sebelum-perbaikan.txt`](./hasil-test-sebelum-perbaikan.txt)).

| ID | Hasil aktual | Waktu | Status | Sebelum perbaikan |
| --- | --- | --- | --- | --- |
| U1-01 | Sesuai yang diharapkan (HABIS) | 1ms | Lulus | Lulus |
| U1-02 | Sesuai yang diharapkan (HAMPIR_HABIS) | 0ms | Lulus | Lulus |
| U1-03 | Sesuai yang diharapkan (AMAN) | 0ms | Lulus | Lulus |
| U1-04 | Sesuai yang diharapkan (HAMPIR_HABIS) | 0ms | Lulus | Lulus |
| U1-05 | Sesuai yang diharapkan (AMAN) | 0ms | Lulus | Lulus |
| U1-06 | Sesuai yang diharapkan (HAMPIR_HABIS) | 0ms | Lulus | Lulus |
| U1-07 | Sesuai yang diharapkan (HABIS; AMAN) | 0ms | Lulus | Lulus |
| U1-08 | Sesuai yang diharapkan (HABIS) | 0ms | Lulus | Lulus |
| U1-09 | Sesuai yang diharapkan (Aman / Hampir Habis / Habis) | 1ms | Lulus | Lulus |
| U2-01 | Sesuai yang diharapkan (subtotal 37.000, pajak 3.700, service 1.850, total 42.550) | 3ms | Lulus | Lulus |
| U2-02 | Sesuai yang diharapkan (64.000) | 0ms | Lulus | Lulus |
| U2-03 | Sesuai yang diharapkan (subtotal 79.000, pajak 7.900, service 3.950, total 90.850) | 0ms | Lulus | Lulus |
| U2-04 | Sesuai yang diharapkan (total 37.000) | 0ms | Lulus | Lulus |
| U2-05 | Sesuai yang diharapkan (semua 0) | 0ms | Lulus | Lulus |
| U2-06 | Sesuai yang diharapkan (pajak 1.235, service 617, total 14.197) | 0ms | Lulus | Lulus |
| U2-07 | Sesuai yang diharapkan (total 74.000) | 0ms | Lulus | Lulus |
| U2-08 | Sesuai yang diharapkan (order tersimpan 37.000/3.700/1.850/42.550, nomor `#TRX-20260925-0001`) | 5ms | Lulus | Lulus |
| U2-09 | Sesuai yang diharapkan (`Nomor meja wajib diisi untuk Dine In.`, transaksi DB tidak dijalankan) | 1ms | Lulus | Lulus |
| U3-01 | Sesuai yang diharapkan (uang kurang, kekurangan 42.550) | 3ms | Lulus | Lulus |
| U3-02 | Sesuai yang diharapkan (uang kurang, kekurangan 1) | 0ms | Lulus | Lulus |
| U3-03 | Sesuai yang diharapkan (cukup, kembalian 0) | 0ms | Lulus | Lulus |
| U3-04 | Sesuai yang diharapkan (cukup, kembalian 7.450) | 0ms | Lulus | Lulus |
| U3-05 | Sesuai yang diharapkan (`CASH_SHORT`; lolos (null)) | 0ms | Lulus | Lulus |
| U3-06 | Sesuai yang diharapkan (ditolak skema) | 2ms | Lulus | Lulus |
| U3-07 | Sesuai yang diharapkan (`Uang tunai kurang dari total tagihan.`, payment tidak dibuat) | 1ms | Lulus | Lulus |
| U3-08 | Sesuai yang diharapkan (payment amountPaid 50.000, change 7.450, order → PAID) | 1ms | Lulus | Lulus |
| U3-09 | Sesuai yang diharapkan (`Pesanan ini sudah dibayar.`) | 1ms | Lulus | Lulus |
| U4-01 | Sesuai yang diharapkan (diterima) | 5ms | Lulus | Lulus |
| U4-02 | Sesuai yang diharapkan (`Nomor referensi wajib diisi` / `QRIS_REF_REQUIRED`) | 1ms | Lulus | Lulus |
| U4-03 | Sesuai yang diharapkan (ditolak) | 0ms | Lulus | Lulus |
| U4-04 | Sesuai yang diharapkan (diterima) | 0ms | Lulus | Lulus |
| U4-05 | Sesuai yang diharapkan (`4 digit terakhir kartu wajib diisi` / `CARD_LAST4_INVALID`) | 0ms | Lulus | Lulus |
| U4-06 | Sesuai yang diharapkan (ditolak) | 0ms | Lulus | Lulus |
| U4-07 | Sesuai yang diharapkan (ditolak) | 0ms | Lulus | Lulus |
| U4-08 | Sesuai yang diharapkan (diterima) | 0ms | Lulus | Lulus |
| U4-09 | Sesuai yang diharapkan (diterima) | 0ms | Lulus | Lulus |
| U4-10 | Sesuai yang diharapkan (ditolak skema) | 1ms | Lulus | Lulus |
| U5-01 | Sesuai yang diharapkan (lolos (null)) | 2ms | Lulus | Lulus |
| U5-02 | Sesuai yang diharapkan (lolos (null)) | 0ms | Lulus | Lulus |
| U5-03 | Sesuai yang diharapkan (`Stok Es Jeruk tidak cukup (sisa 8).`) | 0ms | Lulus | Lulus |
| U5-04 | Sesuai yang diharapkan (`Stok Jus Alpukat tidak cukup (sisa 0).`) | 0ms | Lulus | Lulus |
| U5-05 | Sesuai yang diharapkan (ditolak skema & fungsi) | 2ms | Lulus | Lulus |
| U5-06 | Sesuai yang diharapkan (ditolak skema) | 0ms | Lulus | Lulus |
| U5-07 | Sesuai yang diharapkan (`Minimal 1 item`) | 0ms | Lulus | Lulus |
| U5-08 | Sesuai yang diharapkan (`Produk tidak ditemukan.`; `Menu Lama tidak aktif.`) | 0ms | Lulus | Lulus |
| U5-09 | Sesuai yang diharapkan (`Stok Es Jeruk tidak cukup (sisa 8).`) | 0ms | Lulus | Lulus |
| U5-10 | Sesuai yang diharapkan (gagal, stok & order tidak diubah) | 2ms | Lulus | Lulus |
| U5-11 | Sesuai yang diharapkan (`Stok Es Jeruk tidak cukup, sisa 1.`) | 1ms | Lulus | Lulus |
| U6-01 | Sesuai yang diharapkan (selisih +50, stok akhir 200) | 2ms | Lulus | Lulus |
| U6-02 | Sesuai yang diharapkan (selisih -50) | 1ms | Lulus | Lulus |
| U6-03 | Sesuai yang diharapkan (diterima, selisih -150) | 1ms | Lulus | Lulus |
| U6-04 | Sesuai yang diharapkan (selisih 0) | 0ms | Lulus | Lulus |
| U6-05 | Sesuai yang diharapkan (`Stok baru tidak boleh negatif`) | 1ms | Lulus | Lulus |
| U6-06 | Sesuai yang diharapkan (`Alasan penyesuaian wajib diisi`) | 0ms | Lulus | Lulus |
| U6-07 | Sesuai yang diharapkan (200 diterima, 201 ditolak) | 1ms | Lulus | Lulus |
| U6-08 | Sesuai yang diharapkan (ditolak) | 0ms | Lulus | **Gagal** — `newStock: ""` diterima (di-coerce menjadi 0) |
| U6-09 | Sesuai yang diharapkan (stok akhir 200) | 0ms | Lulus | Lulus |
| U6-10 | Sesuai yang diharapkan (0 ditolak; 1 diterima) | 0ms | Lulus | Lulus |
| U6-11 | Sesuai yang diharapkan (movement ADJUSTMENT +50, 150 → 200) | 1ms | Lulus | Lulus |
| U6-12 | Sesuai yang diharapkan (`Stok baru tidak boleh negatif`, DB tidak disentuh) | 0ms | Lulus | Lulus |
| U7-01 | Sesuai yang diharapkan (valid, angka dikonversi ke number) | 4ms | Lulus | Lulus |
| U7-02 | Sesuai yang diharapkan (4 pesan wajib diisi) | 1ms | Lulus | Lulus |
| U7-03 | Sesuai yang diharapkan (`Nama produk wajib diisi`) | 0ms | Lulus | Lulus |
| U7-04 | Sesuai yang diharapkan (0 ditolak; 1 diterima) | 1ms | Lulus | Lulus |
| U7-05 | Sesuai yang diharapkan (`Harga harus lebih dari 0`) | 0ms | Lulus | Lulus |
| U7-06 | Sesuai yang diharapkan (ditolak) | 1ms | Lulus | Lulus |
| U7-07 | Sesuai yang diharapkan (0 diterima; -1 `Stok tidak boleh negatif`) | 1ms | Lulus | Lulus |
| U7-08 | Sesuai yang diharapkan (`Stok minimum tidak boleh negatif`) | 0ms | Lulus | Lulus |
| U7-09 | Sesuai yang diharapkan (ditolak) | 0ms | Lulus | Lulus |
| U7-10 | Sesuai yang diharapkan (https diterima; ftp ditolak) | 1ms | Lulus | Lulus |
| U8-01 | Sesuai yang diharapkan (`#TRX-20260925-0001`) | 2ms | Lulus | Lulus |
| U8-02 | Sesuai yang diharapkan (`#TRX-20260925-0042`) | 0ms | Lulus | Lulus |
| U8-03 | Sesuai yang diharapkan (`#TRX-20260925-9999`) | 0ms | Lulus | Lulus |
| U8-04 | Sesuai yang diharapkan (cocok regex `^#TRX-\d{8}-\d{4}$`) | 0ms | Lulus | Lulus |
| U8-05 | Sesuai yang diharapkan (`#TRX-20260105-0001`) | 0ms | Lulus | Lulus |
| U8-06 | Sesuai yang diharapkan (`#TRX-20260925-0001`) | 0ms | Lulus | **Gagal** — `#TRX-20260924-0001` |
| U8-07 | Sesuai yang diharapkan (`#TRX-20260924-0004`) | 0ms | Lulus | Lulus |
| U8-08 | Sesuai yang diharapkan (rentang 2026-09-24T17:00:00.000Z – 2026-09-25T16:59:59.999Z) | 0ms | Lulus | **Gagal** — awal rentang `2026-09-25T00:00:00.000Z` (07:00 WIB) |
| U8-09 | Sesuai yang diharapkan (awal rentang sama) | 0ms | Lulus | **Gagal** — awal rentang berbeda: `2026-09-24T00:00Z` vs `2026-09-25T00:00Z` |
| U9-01 | Sesuai yang diharapkan (`Rp 42.550`) | 18ms | Lulus | Lulus |
| U9-02 | Sesuai yang diharapkan (`Rp 0`) | 0ms | Lulus | Lulus |
| U9-03 | Sesuai yang diharapkan (`Rp 1.235`) | 0ms | Lulus | Lulus |
| U9-04 | Sesuai yang diharapkan (`Rp 0`) | 0ms | Lulus | Lulus |
| U9-05 | Sesuai yang diharapkan (`1.234.567`; `4,28 jt`) | 0ms | Lulus | Lulus |
| U9-06 | Sesuai yang diharapkan (`Rabu, 23 September 2026`) | 5ms | Lulus | Lulus |
| U9-07 | Sesuai yang diharapkan (`Rabu, 23 September 2026`; `Kamis, 24 September 2026`) | 1ms | Lulus | Lulus |
| U9-08 | Sesuai yang diharapkan (`23 Sep 2026, 14.32`; `14.32`) | 1ms | Lulus | Lulus |
| U9-09 | Sesuai yang diharapkan (10; 100; 0) | 0ms | Lulus | Lulus |
| U10-01 | Sesuai yang diharapkan (lanjut (next)) | 2ms | Lulus | Lulus |
| U10-02 | Sesuai yang diharapkan (redirect /403) | 0ms | Lulus | Lulus |
| U10-03 | Sesuai yang diharapkan (redirect /403) | 0ms | Lulus | Lulus |
| U10-04 | Sesuai yang diharapkan (lanjut) | 0ms | Lulus | Lulus |
| U10-05 | Sesuai yang diharapkan (redirect /403) | 0ms | Lulus | Lulus |
| U10-06 | Sesuai yang diharapkan (lanjut) | 0ms | Lulus | Lulus |
| U10-07 | Sesuai yang diharapkan (lanjut) | 0ms | Lulus | Lulus |
| U10-08 | Sesuai yang diharapkan (/login?callbackUrl=/stok; /login; lanjut) | 0ms | Lulus | Lulus |
| U10-09 | Sesuai yang diharapkan (redirect /dashboard) | 0ms | Lulus | Lulus |
| U10-10 | Sesuai yang diharapkan (redirect /403) | 0ms | Lulus | Lulus |
| U10-11 | Sesuai yang diharapkan (ADMIN 6 menu (tanpa Kasir); KASIR: Dashboard, Kasir, Pesanan, Stok) | 0ms | Lulus | Lulus |
| U11-01 | Sesuai yang diharapkan (2026-09-20T17:00:00.000Z – 2026-09-27T16:59:59.999Z (Sen 21 – Min 27 Sep WIB)) | 3ms | Lulus | **Gagal** — awal `2026-09-21T00:00:00.000Z` (07:00 WIB) |
| U11-02 | Sesuai yang diharapkan (mulai 2027-01-03T17:00:00.000Z (Sen 4 Jan WIB)) | 0ms | Lulus | **Gagal** — `2027-01-04T00:00:00.000Z` |
| U11-03 | Sesuai yang diharapkan (2026-12-27T17:00:00.000Z – 2027-01-03T16:59:59.999Z) | 0ms | Lulus | **Gagal** — awal `2026-12-28T00:00:00.000Z` |
| U11-04 | Sesuai yang diharapkan (2026-08-31T17:00:00.000Z – 2026-09-30T16:59:59.999Z, label `September 2026`) | 18ms | Lulus | **Gagal** — awal `2026-09-01T00:00:00.000Z` |
| U11-05 | Sesuai yang diharapkan (akhir 2028-02-29T16:59:59.999Z) | 1ms | Lulus | **Gagal** — akhir `2028-02-29T23:59:59.999Z` |
| U11-06 | Sesuai yang diharapkan (label `Minggu ke-1, <tahun berjalan>`) | 0ms | Lulus | Lulus |
| U11-07 | Sesuai yang diharapkan (pendapatan 105.800, 3 transaksi, rata-rata 35.267) | 1ms | Lulus | Lulus |
| U11-08 | Sesuai yang diharapkan (0 / 0 / 0) | 0ms | Lulus | Lulus |
| U11-09 | Sesuai yang diharapkan (21 Sep: 88.550 (2); 23 Sep: 17.250 (1)) | 1ms | Lulus | **Gagal** — pesanan 01:00 WIB 23 Sep masuk tanggal `2026-09-22` |
| U11-10 | Sesuai yang diharapkan (filter PAID + rentang WIB; total 105.800; terlaris Air Mineral) | 1ms | Lulus | **Gagal** — filter `gte` `2026-09-21T00:00:00.000Z` |
| U11-11 | Sesuai yang diharapkan (kategori: Makanan Utama 64.000, Minuman 28.000; metode: CASH 42.550, DEBIT 17.250, QRIS 46.000) | 1ms | Lulus | Lulus |

## 5. Ringkasan

| Keterangan | Sebelum perbaikan | Setelah perbaikan |
| --- | --- | --- |
| Total kasus uji | 110 | 110 |
| Lulus | 99 | 110 |
| Gagal | 11 | 0 |
| Persentase lulus | 90.0% | 100.0% |

### 5.1 Per unit
| Unit | Nama | Jumlah kasus | Lulus | Gagal |
| --- | --- | --- | --- | --- |
| U1 | Status stok | 9 | 9 | 0 |
| U2 | Hitung billing | 9 | 9 | 0 |
| U3 | Pembayaran tunai | 9 | 9 | 0 |
| U4 | Validasi non tunai | 10 | 10 | 0 |
| U5 | Validasi stok pesanan | 11 | 11 | 0 |
| U6 | Update/penyesuaian stok | 12 | 12 | 0 |
| U7 | Validasi form produk (zod) | 10 | 10 | 0 |
| U8 | Nomor transaksi | 9 | 9 | 0 |
| U9 | Format rupiah & tanggal | 9 | 9 | 0 |
| U10 | Hak akses role | 11 | 11 | 0 |
| U11 | Laporan periode | 11 | 11 | 0 |

### 5.2 Coverage per file (`npm run test:coverage`)
| File | % Statements | % Branch | % Functions | % Lines | Baris belum tercakup |
| --- | --- | --- | --- | --- | --- |
| **Semua file** | 98.06 | 93.7 | 95.45 | 98.58 | - |
| `src/lib/access.ts` | 100 | 100 | 100 | 100 | - |
| `src/lib/billing.ts` | 100 | 95.65 | 100 | 100 | 55 |
| `src/lib/order-number.ts` | 100 | 100 | 100 | 100 | - |
| `src/lib/period.ts` | 100 | 87.5 | 100 | 100 | 30-31 |
| `src/lib/reports.ts` | 96.66 | 83.33 | 100 | 100 | 47,69-81 |
| `src/lib/stock.ts` | 100 | 100 | 100 | 100 | - |
| `src/lib/timezone.ts` | 100 | 100 | 100 | 100 | - |
| `src/lib/utils.ts` | 90.9 | 80 | 87.5 | 90 | 5 |
| `src/lib/validations.ts` | 92.3 | 100 | 80 | 92.3 | 100 |

Ringkasan coverage: **Statements 98.06% (152/155), Branches 93.7% (119/127), Functions 95.45% (42/44), Lines 98.58% (139/141)**.

## 6. Evaluasi Hasil Uji

### 6.1 Bug yang ditemukan dan perbaikannya

Test ditulis berdasarkan kebutuhan, lalu dijalankan terhadap kode asli. Run pertama: **99 lulus, 11 gagal**.
Semua kegagalan berasal dari dua bug di kode aplikasi (bukan salah test), jadi yang diperbaiki kodenya, sedangkan test tidak diubah.

**BUG-01 — Tanggal nomor transaksi & periode laporan memakai jam server, bukan WIB**
(kasus gagal: U8-06, U8-08, U8-09, U11-01, U11-02, U11-03, U11-04, U11-05, U11-09, U11-10)

- *Penyebab:* `nextOrderNumber` (actions/orders.ts) dan `isoWeekToRange`/`monthToRange`/tren harian (lib/reports.ts)
  memakai `getFullYear()/getDate()/setHours()`, yang mengikuti zona waktu server. Di laptop pengembang (WIB) hasilnya benar,
  tetapi server Vercel berjalan dalam UTC.
- *Dampak di produksi:* pesanan pukul 00:00–06:59 WIB mendapat tanggal hari sebelumnya
  (mis. pesanan 00:30 WIB 25 Sep bernomor `#TRX-20260924-0001`), dan nomor urut hariannya ikut terhitung di hari sebelumnya.
  Laporan mingguan/bulanan bergeser 7 jam: transaksi 00:00–06:59 WIB di hari pertama periode tidak ikut terhitung,
  sedangkan transaksi 00:00–06:59 WIB setelah periode berakhir malah ikut. Tren harian juga menaruh pesanan dini hari di tanggal yang salah.
- *Perbaikan:* helper baru `src/lib/timezone.ts` (`wibParts`, `wibDate`; Asia/Jakarta = UTC+7 tanpa DST).
  `order-number.ts` dan `period.ts` sekarang menghitung tanggal, awal/akhir hari, minggu ISO, dan bulan dalam WIB,
  apa pun zona waktu server. Label bulan diformat dengan `timeZone: "Asia/Jakarta"`.
  Di mesin yang zonanya WIB, perilakunya tetap sama seperti sebelumnya.
- *Sesudah perbaikan:* 10 kasus tersebut lulus.

**BUG-02 — Penyesuaian stok menerima "stok baru" kosong sebagai 0**
(kasus gagal: U6-08)

- *Penyebab:* `stockAdjustSchema.newStock` memakai `z.coerce.number()`, dan `Number("") === 0`.
- *Dampak:* permintaan ke server action `stockAdjust` dengan `newStock` kosong diterima dan **mengosongkan stok menjadi 0**.
  Form di UI memang punya atribut `required`, tetapi validasi di server (sumber kebenaran) tidak menolaknya.
- *Perbaikan:* input kosong/spasi diubah menjadi `undefined` sebelum di-coerce, sehingga ditolak dengan pesan
  "Stok baru wajib diisi". Nilai 0 yang diisi dengan sengaja tetap diterima (U6-03).
- *Sesudah perbaikan:* U6-08 lulus.

| Run | Total | Lulus | Gagal |
| --- | --- | --- | --- |
| Sebelum perbaikan | 110 | 99 | 11 |
| Setelah perbaikan | 110 | 110 | 0 |

### 6.2 Catatan kesesuaian kebutuhan
- **U4:** di aplikasi, *nomor referensi* wajib untuk **QRIS**, sedangkan untuk **Debit/Kredit** yang wajib adalah **4 digit terakhir kartu**
  (nomor referensi kartu opsional). Test mengikuti aturan aplikasi ini (U4-04, U4-08). Jika dosen/penguji mengharuskan
  nomor referensi juga untuk kartu, aturan di `paymentSchema` dan `validatePaymentInput` perlu ditambah.
- Format jam `id-ID` memakai titik (`14.32`), bukan titik dua. Ini standar locale Indonesia, bukan bug (U9-08).

### 6.3 Unit / bagian yang belum tercakup
- **Baris yang belum tercakup (lihat coverage):** `utils.ts` baris 5 (`cn()`, penggabung class CSS, bukan logika bisnis);
  `validations.ts` baris 100 (refine konfirmasi password pada `passwordChangeSchema`); `reports.ts` baris 47 dan 69–81
  (cabang pesanan tanpa data pembayaran dan cabang `topProduct` kosong); `period.ts` baris 30–31 (fallback bulan berjalan
  jika format bulan salah); `billing.ts` baris 55 (cabang default `cash ?? 0`).
- **Belum diuji unit:** `settingSchema`, `userCreateSchema`, `passwordChangeSchema`, pembatalan pesanan (`cancelOrder`,
  pengembalian stok), `createProduct`/`updateProduct` (cek kode duplikat), store keranjang Zustand (`src/store/cart.ts`),
  data dashboard (`src/lib/dashboard.ts`), export CSV laporan, dan komponen UI React.
- **Rekomendasi lanjutan:** `src/lib/dashboard.ts` (penjualan "hari ini", "kemarin", 7 hari terakhir) dan periode default
  di `src/app/(dashboard)/laporan/page.tsx` masih memakai jam server, jadi masalahnya sama dengan BUG-01. Keduanya di luar
  11 unit tugas ini sehingga belum diubah; sebaiknya dipindahkan ke helper `timezone.ts` dan diberi unit test di iterasi berikutnya.
