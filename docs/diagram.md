# Diagram Sistem — Dapur Bu Aina

Seluruh diagram ditulis dalam sintaks **Mermaid**. Dapat dilihat langsung di GitHub, VS Code
(ekstensi Markdown Preview Mermaid), atau https://mermaid.live.

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Order : "melayani (cashier)"
    User ||--o{ Payment : "mengonfirmasi"
    User ||--o{ StockMovement : "mencatat"
    Category ||--o{ Product : "memiliki"
    Product ||--o{ OrderItem : "dipesan"
    Product ||--o{ StockMovement : "berubah"
    Order ||--o{ OrderItem : "berisi"
    Order ||--|| Payment : "dibayar"

    User {
        string id PK
        string name
        string username UK
        string passwordHash
        enum role "ADMIN | KASIR"
        string avatarUrl
        datetime createdAt
    }
    Category {
        string id PK
        string name UK
        string slug UK
    }
    Product {
        string id PK
        string code UK
        string name
        string categoryId FK
        int price
        int stock
        int minStock
        string unit
        string imageUrl
        boolean isActive
    }
    StockMovement {
        string id PK
        string productId FK
        enum type "IN | OUT | ADJUSTMENT"
        int quantity
        int stockBefore
        int stockAfter
        string note
        string userId FK
        datetime createdAt
    }
    Order {
        string id PK
        string orderNumber UK
        enum orderType "DINE_IN | TAKE_AWAY"
        string tableNumber
        string customerName
        enum status "PENDING | PAID | CANCELLED"
        int subtotal
        int tax
        int serviceCharge
        int total
        string cashierId FK
        datetime createdAt
    }
    OrderItem {
        string id PK
        string orderId FK
        string productId FK
        string productName
        int price
        int quantity
        int subtotal
    }
    Payment {
        string id PK
        string orderId FK "unique"
        enum method "CASH | DEBIT | CREDIT_CARD | QRIS"
        int amountPaid
        int change
        string referenceNo
        string cardLast4
        enum status "CONFIRMED"
        datetime paidAt
        string confirmedById FK
    }
    Setting {
        string id PK
        string restaurantName
        string tagline
        string address
        string phone
        int taxPercent
        int servicePercent
    }
```

## 2. Use Case Diagram

```mermaid
flowchart TB
    Admin([Administrator])
    Kasir([Kasir])

    subgraph Sistem[Sistem Manajemen Dapur Bu Aina]
        UC1[Login]
        UC2[Lihat Dashboard]
        UC3[Kelola Produk]
        UC4[Input & Update Stok]
        UC5[Lihat Stok]
        UC6[Buat Pesanan]
        UC7[Proses Billing & Pembayaran]
        UC8[Cetak Struk]
        UC9[Lihat Laporan]
        UC10[Kelola Pengaturan & User]
        UC11[Tes Koneksi Database]
    end

    Admin --- UC1
    Admin --- UC2
    Admin --- UC3
    Admin --- UC4
    Admin --- UC6
    Admin --- UC7
    Admin --- UC8
    Admin --- UC9
    Admin --- UC10
    Admin --- UC11

    Kasir --- UC1
    Kasir --- UC2
    Kasir --- UC5
    Kasir --- UC6
    Kasir --- UC7
    Kasir --- UC8
```

## 3. Activity Diagram — Pemesanan → Billing → Pembayaran

```mermaid
flowchart TD
    Start([Mulai]) --> A[Pilih menu & tambah ke keranjang]
    A --> B{Tipe pesanan?}
    B -->|Dine In| C[Isi nomor meja]
    B -->|Take Away| D[Isi nama pelanggan]
    C --> E[Simpan pesanan]
    D --> E
    E --> F{Stok cukup?}
    F -->|Tidak| G[Tampilkan error stok] --> A
    F -->|Ya| H[Status PENDING, stok berkurang, catat StockMovement OUT]
    H --> I[Tampilkan halaman Billing]
    I --> J{Pilih metode bayar}
    J -->|Tunai| K[Input uang diterima]
    K --> L{Uang >= total?}
    L -->|Tidak| M[Tolak: uang kurang] --> K
    L -->|Ya| N[Hitung kembalian]
    J -->|Non Tunai| O[Input ref / 4 digit kartu]
    N --> P[Konfirmasi pembayaran]
    O --> P
    P --> Q[Simpan Payment, Order jadi PAID]
    Q --> R[Tampilkan struk LUNAS + Cetak]
    R --> End([Selesai])
```

## 4. Flowchart Login

```mermaid
flowchart TD
    Start([Mulai]) --> A[Buka aplikasi]
    A --> B{Sudah login?}
    B -->|Ya| C[Redirect ke Dashboard]
    B -->|Tidak| D[Tampilkan halaman Login]
    D --> E[Input username & password]
    E --> F[Submit]
    F --> G{Kredensial valid?}
    G -->|Tidak| H[Tampilkan pesan error] --> D
    G -->|Ya| I[Buat session JWT + simpan role]
    I --> J{Role?}
    J -->|ADMIN| K[Akses semua menu]
    J -->|KASIR| L[Akses menu terbatas]
    K --> C
    L --> C
    C --> End([Selesai])
```

## 5. Activity Diagram — Alur Kasir 4 Layar (POS)

```mermaid
flowchart TD
    Start([Kasir login]) --> K1["Layar 1: /kasir — Pilih Menu"]
    K1 --> A[Tambah item ke keranjang]
    A --> B{Tipe pesanan}
    B -->|Dine In| C[Pilih nomor meja]
    B -->|Take Away| D[Isi nama pelanggan]
    C --> E[Isi catatan pesanan opsional]
    D --> E
    E --> F[Klik 'Lanjut ke Detail Pesanan']
    F --> K2["Layar 2: /kasir/detail — Detail/Billing"]
    K2 --> G[Ubah qty / hapus item / ubah meja]
    G --> H[Klik 'Lanjut ke Pembayaran']
    H --> I{Transaksi createOrder}
    I -->|updateMany stock >= qty count 0| J["Tolak: Stok {nama} tidak cukup, sisa X"] --> K2
    I -->|sukses| L[Order PENDING + item + StockMovement OUT + No #TRX-YYYYMMDD-XXXX]
    L --> M[Kosongkan keranjang]
    M --> K3["Layar 3: /kasir/pembayaran/[orderId]"]
    K3 --> N{Pilih metode}
    N -->|Tunai| O[Input nominal → hitung kembalian]
    N -->|QRIS| P[QR dummy + nomor referensi]
    N -->|Debit/Kredit| Q[Pilih Debit/Kredit + 4 digit + approval]
    O --> R[Dialog konfirmasi]
    P --> R
    Q --> R
    R --> S{confirmPayment - validasi ulang di server}
    S -->|order masih PENDING & nominal cukup| T[Buat Payment + Order PAID]
    S -->|sudah PAID / kurang| U[Tolak, cegah double-submit] --> K3
    T --> K4["Layar 4: /kasir/sukses/[orderId]"]
    K4 --> V[Tampilkan struk + Cetak Struk]
    V --> W[Klik 'Transaksi Baru'] --> K1
    K3 -.->|Batalkan pesanan| X[Order CANCELLED + StockMovement IN kembalikan stok] --> K1
```

## 6. Sequence Diagram — Sinkronisasi Real-time Kasir ↔ Admin

```mermaid
sequenceDiagram
    participant Kasir as Browser Kasir
    participant DB as PostgreSQL
    participant Admin as Browser Admin

    Kasir->>DB: createOrder (PENDING, stok -)
    Note over Admin: AutoRefresh tiap 5 dtk<br/>router.refresh()
    Admin->>DB: GET /api/realtime/summary
    DB-->>Admin: pendingCount+1, stok menipis
    Admin->>DB: refetch server component (force-dynamic)
    DB-->>Admin: pesanan "Menunggu" tampil, stok berkurang

    Kasir->>DB: confirmPayment (PAID)
    Admin->>DB: AutoRefresh berikutnya
    DB-->>Admin: status "Lunas", Penjualan Hari Ini naik

    Admin->>DB: update/nonaktifkan stok produk
    Note over Kasir: AutoRefresh di /kasir
    Kasir->>DB: refetch produk
    DB-->>Kasir: menu berubah (habis/tersedia)
```

## 7. Activity Diagram — Input/Update Stok (Tugas 3a)

```mermaid
flowchart TD
    Start([Mulai]) --> A[Buka menu Stok Barang]
    A --> B[Terapkan kriteria: kategori / status / pencarian]
    B --> C[Sistem menampilkan produk sesuai kriteria]
    C --> D{Aksi?}
    D -->|Stok Masuk| E[Pilih produk + jumlah + catatan]
    D -->|Penyesuaian| F[Pilih produk + stok baru + alasan]
    E --> G[Transaksi: update Product.stock + buat StockMovement IN]
    F --> H[Transaksi: update Product.stock + buat StockMovement ADJUSTMENT]
    G --> I[Tampilkan notifikasi sukses & refresh data]
    H --> I
    I --> End([Selesai])
```
