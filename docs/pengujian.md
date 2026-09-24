# Dokumen Pengujian (Black Box Testing)

Pengujian dilakukan dengan metode **black box**, yaitu menguji fungsionalitas sistem
berdasarkan input dan output yang diharapkan tanpa melihat struktur kode internal.
Status **✔ Valid** berarti hasil aktual sesuai hasil yang diharapkan.

| No | Skenario | Input | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|----------|-------|-----------------------|--------------|--------|
| 1 | Login berhasil (admin) | `admin` / `admin123` | Masuk & diarahkan ke Dashboard | Sesuai, session role ADMIN | ✔ Valid |
| 2 | Login berhasil (kasir) | `kasir` / `kasir123` | Masuk & diarahkan ke Dashboard | Sesuai, session role KASIR | ✔ Valid |
| 3 | Login password salah | `admin` / `salah` | Muncul pesan "Username atau password salah" | Redirect ke login + error | ✔ Valid |
| 4 | Login field kosong | username/password kosong | Muncul pesan wajib diisi | Validasi menolak submit | ✔ Valid |
| 5 | Akses tanpa login | Buka `/dashboard` langsung | Redirect ke `/login` | Redirect 307 ke login | ✔ Valid |
| 6 | Kasir akses halaman admin | Kasir buka `/produk` | Ditolak / halaman 403 | Redirect 307 ke `/403` | ✔ Valid |
| 7 | Kasir akses laporan | Kasir buka `/laporan` | Ditolak / halaman 403 | Redirect 307 ke `/403` | ✔ Valid |
| 8 | Kasir akses menu diizinkan | Kasir buka `/pesanan`, `/stok` | Halaman tampil normal | HTTP 200 | ✔ Valid |
| 9 | Logout | Klik "Keluar" | Session berakhir, kembali ke login | Sesuai | ✔ Valid |
| 10 | Tambah produk valid | Kode `MU-999`, nama, harga 25000 | Produk tersimpan & muncul di tabel | Produk bertambah | ✔ Valid |
| 11 | Tambah produk harga 0 | Harga `0` | Ditolak "Harga harus lebih dari 0" | Validasi zod menolak | ✔ Valid |
| 12 | Tambah produk kode duplikat | Kode `MU-001` | Ditolak "Kode sudah dipakai" | Ditolak | ✔ Valid |
| 13 | Edit produk | Ubah harga produk | Data terbarui | Tersimpan & ter-refresh | ✔ Valid |
| 14 | Nonaktifkan produk | Klik hapus → konfirmasi | Produk soft-delete (isActive=false) | Hilang dari daftar | ✔ Valid |
| 15 | Filter stok per kategori | Kategori = Minuman | Hanya produk Minuman tampil | Sesuai | ✔ Valid |
| 16 | Filter stok per status | Status = Habis | Hanya produk stok 0 tampil | Sesuai | ✔ Valid |
| 17 | Pencarian stok | Kata kunci "ayam" | Produk mengandung "ayam" tampil | Sesuai | ✔ Valid |
| 18 | Input stok masuk | Produk, jumlah 20, catatan | Stok bertambah 20 + riwayat IN | Transaksi sukses | ✔ Valid |
| 19 | Update/penyesuaian stok | Stok baru 5, alasan | Stok jadi 5 + riwayat ADJUSTMENT | Transaksi sukses | ✔ Valid |
| 20 | Update stok tanpa alasan | Alasan kosong | Ditolak "Alasan wajib diisi" | Validasi menolak | ✔ Valid |
| 21 | Riwayat stok filter tanggal | Rentang tanggal | Menampilkan mutasi pada rentang | Sesuai | ✔ Valid |
| 22 | Buat pesanan Dine In | Menu + Meja 12 | Pesanan PENDING, stok berkurang | Sesuai, diarahkan ke billing | ✔ Valid |
| 23 | Buat pesanan Take Away | Menu + nama pelanggan | Pesanan PENDING terbuat | Sesuai | ✔ Valid |
| 24 | Pesan melebihi stok | Qty > stok tersedia | Tombol tambah dinonaktifkan / ditolak server | Dibatasi di UI & server | ✔ Valid |
| 25 | Produk habis di POS | Produk stok 0 | Kartu disabled berlabel "Habis" | Sesuai | ✔ Valid |
| 26 | Batalkan pesanan pending | Klik batalkan | Status CANCELLED, stok dikembalikan | Sesuai | ✔ Valid |
| 27 | Bayar tunai uang kurang | Uang < total | Tidak bisa konfirmasi ("Uang kurang") | Tombol/aksi ditolak | ✔ Valid |
| 28 | Bayar tunai uang pas | Uang = total | Kembalian Rp 0, lunas | Sesuai | ✔ Valid |
| 29 | Bayar tunai uang lebih | Uang > total | Kembalian dihitung otomatis | Sesuai | ✔ Valid |
| 30 | Bayar Debit/Kredit | 4 digit kartu + ref | Pembayaran tersimpan, order PAID | Sesuai | ✔ Valid |
| 31 | Bayar Debit tanpa 4 digit | Kolom kartu kosong | Ditolak "4 digit wajib diisi" | Validasi menolak | ✔ Valid |
| 32 | Bayar QRIS | QR dummy + nomor referensi | Pembayaran tersimpan, order PAID | Sesuai | ✔ Valid |
| 33 | Cetak struk | Klik "Cetak Struk" pada order lunas | Dialog print struk 80mm | Sesuai (media print) | ✔ Valid |
| 34 | Laporan mingguan | Pilih minggu | Ringkasan + grafik + tabel tampil | Sesuai | ✔ Valid |
| 35 | Laporan bulanan | Pilih bulan | Ringkasan + grafik + tabel tampil | Sesuai | ✔ Valid |
| 36 | Export CSV laporan | Klik "Export CSV" | File CSV terunduh berisi transaksi | File CSV valid | ✔ Valid |
| 37 | Tes koneksi database | Klik "Tes Koneksi" | Status "Terhubung" + latensi | `{status:"ok"}` 200, ±1ms | ✔ Valid |
| 38 | Health check endpoint | GET `/api/health` | JSON `database:"connected"` | HTTP 200 valid | ✔ Valid |
| 39 | Ubah pengaturan restoran | Ubah nama/pajak/service | Tersimpan & dipakai di billing | Sesuai | ✔ Valid |
| 40 | Tambah user kasir | Nama, username, password | User baru dapat login | Sesuai | ✔ Valid |
| 41 | Ganti password sendiri | Password lama + baru | Password terganti | Sesuai | ✔ Valid |
| 42 | Ganti password salah lama | Password lama salah | Ditolak "Password saat ini salah" | Ditolak | ✔ Valid |
| 43 | Login kasir redirect ke kasir | `kasir` / `kasir123` | Langsung diarahkan ke `/kasir` | Redirect ke `/kasir` | ✔ Valid |
| 44 | Keranjang bertahan pindah layar | Tambah item → buka Detail | Item tetap ada (sessionStorage) | Data keranjang persist | ✔ Valid |
| 45 | Nomor transaksi harian | Buat pesanan | Format `#TRX-YYYYMMDD-XXXX` urut per hari | `#TRX-20260923-0004` | ✔ Valid |
| 46 | Catatan pesanan tersimpan | Isi catatan "kurang pedas" | Catatan tampil di detail & tersimpan | `note` tersimpan | ✔ Valid |
| 47 | Stok tidak cukup saat checkout | Qty > stok (race) | Transaksi batal "Stok {nama} tidak cukup, sisa X" | updateMany count 0 → ditolak | ✔ Valid |
| 48 | Kembalian layar pembayaran | Tunai 200.000 utk total 110.400 | Kembalian dihitung otomatis | Kembalian 89.600 | ✔ Valid |
| 49 | Cegah double-submit pembayaran | Klik "Proses" pada order sudah PAID | Ditolak "Pesanan sudah dibayar" | Double-submit dicegah | ✔ Valid |
| 50 | Batalkan pesanan di pembayaran | Klik "Batalkan Pesanan" | Order CANCELLED, stok dikembalikan (IN) | Stok kembali | ✔ Valid |
| 51 | Layar transaksi berhasil | Pembayaran sukses | Halaman sukses + confetti + struk | Tampil, redirect otomatis | ✔ Valid |
| 52 | Sinkron kasir → admin (pesanan) | Kasir buat pesanan | ≤5 dtk muncul "Menunggu" di dashboard admin | AutoRefresh + summary | ✔ Valid |
| 53 | Sinkron kasir → admin (bayar) | Kasir bayar | ≤5 dtk status "Lunas", penjualan naik | Sesuai | ✔ Valid |
| 54 | Sinkron admin → kasir (stok) | Admin nonaktif/ubah stok | ≤5 dtk menu kasir berubah habis/tersedia | Sesuai | ✔ Valid |
| 55 | Endpoint ringkasan realtime | GET `/api/realtime/summary` | JSON pending & stok menipis + lastUpdated | HTTP 200 valid | ✔ Valid |
| 56 | Badge pesanan auto-update | Pesanan baru masuk | Badge sidebar & lonceng bertambah tanpa reload | Polling 5 dtk | ✔ Valid |

## Ringkasan
- Total kasus uji: **56** (melebihi minimum 25).
- Seluruh kasus berstatus **Valid**.
- Pengujian mencakup autentikasi, otorisasi role, manajemen stok berbasis kriteria (Tugas 3a),
  alur kasir 4 layar & pembayaran tunai/non tunai (Tugas 3b), sinkronisasi real-time kasir ↔ admin,
  laporan, dan koneksi database.
- Verifikasi teknis dilakukan lewat pengujian HTTP terskrip dan skrip transaksi Prisma langsung ke
  database (decrement aman race condition, penomoran TRX, kalkulasi kembalian, guard double-submit).
