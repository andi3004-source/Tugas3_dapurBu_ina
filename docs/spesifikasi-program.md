# Spesifikasi Program — Sistem Manajemen Restoran "Dapur Bu Aina"

## 1. Deskripsi Sistem
**Dapur Bu Aina** adalah aplikasi web terkomputerisasi untuk mendukung operasional dan
transaksi restoran, mulai dari pemesanan pelanggan (dine-in per nomor meja atau take away),
pengelolaan stok makanan & minuman, proses billing dan pembayaran (tunai maupun non tunai),
hingga laporan penjualan berkala (mingguan dan bulanan).

Sistem dibangun dengan arsitektur modern berbasis **Next.js (App Router)** dan **PostgreSQL**
melalui ORM **Prisma**, sehingga seluruh data tersimpan dan terkoneksi ke basis data secara
real-time. Koneksi database dapat diverifikasi melalui indikator status dan endpoint
health check.

## 2. Tujuan
- Menggantikan pencatatan manual dengan sistem digital yang akurat.
- Mempercepat proses pemesanan sampai pembayaran.
- Memberikan kontrol stok yang jelas (aman / hampir habis / habis).
- Menyajikan laporan penjualan yang dapat dianalisis pimpinan.

## 3. Ruang Lingkup
Kategori produk dibatasi menjadi **3**: **Makanan Utama, Appetizer, Minuman**.
Metode pembayaran yang didukung: **Tunai, Debit, Kartu Kredit, QRIS**.

## 4. Kebutuhan Fungsional
| Kode | Kebutuhan |
|------|-----------|
| F-01 | Sistem menyediakan autentikasi login dengan username & password. |
| F-02 | Sistem membedakan hak akses berdasarkan role (ADMIN & KASIR). |
| F-03 | Admin dapat mengelola produk (tambah, ubah, nonaktifkan). |
| F-04 | Sistem menampilkan & memperbarui data stok berdasarkan kriteria (kategori, status, pencarian). — **Tugas 3a** |
| F-05 | Setiap perubahan stok tercatat pada riwayat (StockMovement) via transaksi database. |
| F-06 | Kasir/Admin dapat membuat pesanan dine-in atau take away. |
| F-07 | Stok berkurang otomatis saat pesanan dibuat dan kembali saat dibatalkan. |
| F-08 | Sistem menampilkan billing/tagihan dari pesanan. — **Tugas 3b** |
| F-09 | Pembayaran tunai menghitung kembalian otomatis dan menolak jika uang kurang. |
| F-10 | Pembayaran non tunai meminta nomor referensi / 4 digit kartu + konfirmasi. |
| F-11 | Struk dapat dicetak (format thermal 80mm) setelah lunas. |
| F-12 | Admin dapat melihat laporan penjualan mingguan & bulanan, export CSV, dan cetak PDF. |
| F-13 | Admin dapat mengelola pengaturan restoran dan pengguna. |
| F-14 | Sistem menyediakan health check koneksi database (`/api/health`). |
| F-15 | Dashboard menampilkan statistik penjualan real-time. |

## 5. Kebutuhan Non-Fungsional
| Kode | Kebutuhan |
|------|-----------|
| NF-01 | **Keamanan** — password di-hash (bcrypt), proteksi route via middleware + verifikasi role di server. |
| NF-02 | **Usability** — antarmuka berbahasa Indonesia, responsif (desktop & mobile). |
| NF-03 | **Keandalan** — mutasi data memakai transaksi database (atomic). |
| NF-04 | **Performa** — query terindeks, health check menampilkan latensi. |
| NF-05 | **Portabilitas** — dapat dijalankan lokal maupun di-deploy ke Vercel + Neon. |
| NF-06 | **Konsistensi** — format angka & tanggal mengikuti lokal id-ID (zona Asia/Jakarta). |

## 6. Daftar Pengguna & Hak Akses
| Role | Hak Akses |
|------|-----------|
| **ADMIN** | Seluruh menu: Dashboard, Pesanan, Produk, Stok, Pembayaran, Laporan, Pengaturan (kelola user). |
| **KASIR** | Dashboard, Pesanan, Pembayaran, serta melihat Produk & Stok (read-only). Tidak dapat mengakses Produk (CRUD), Laporan, dan Pengaturan. |

### Akun Default (hasil seed)
| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |
| `kasir` | `kasir123` | KASIR |
