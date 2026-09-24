import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type ProductSeed = {
  code: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  image: string;
};

const IMG = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=200&q=60`;

const DATA: Record<string, ProductSeed[]> = {
  "Makanan Utama": [
    { code: "MU-001", name: "Ayam Bakar Madu", price: 32000, stock: 40, minStock: 10, unit: "porsi", image: IMG("photo-1598515214211-89d3c73ae83b") },
    { code: "MU-002", name: "Nasi Putih", price: 6000, stock: 120, minStock: 20, unit: "porsi", image: IMG("photo-1516684732162-798a0062be99") },
    { code: "MU-003", name: "Mie Goreng Spesial", price: 25000, stock: 8, minStock: 10, unit: "porsi", image: IMG("photo-1585032226651-759b368d7246") },
    { code: "MU-004", name: "Nasi Goreng Spesial", price: 27000, stock: 35, minStock: 10, unit: "porsi", image: IMG("photo-1512058564366-18510be2db19") },
    { code: "MU-005", name: "Soto Ayam Lamongan", price: 22000, stock: 0, minStock: 8, unit: "porsi", image: IMG("photo-1547592180-85f173990554") },
    { code: "MU-006", name: "Ikan Gurame Asam Manis", price: 55000, stock: 15, minStock: 5, unit: "porsi", image: IMG("photo-1544025162-d76694265947") },
    { code: "MU-007", name: "Sate Ayam (10 tusuk)", price: 30000, stock: 22, minStock: 8, unit: "porsi", image: IMG("photo-1529563021893-cc83c992d75d") },
  ],
  Appetizer: [
    { code: "AP-001", name: "Tahu Crispy", price: 15000, stock: 30, minStock: 10, unit: "porsi", image: IMG("photo-1541529086526-db283c563270") },
    { code: "AP-002", name: "Kentang Goreng", price: 18000, stock: 5, minStock: 10, unit: "porsi", image: IMG("photo-1573080496219-bb080dd4f877") },
    { code: "AP-003", name: "Lumpia Semarang", price: 20000, stock: 18, minStock: 8, unit: "porsi", image: IMG("photo-1625938145312-c22f6a5f3f77") },
    { code: "AP-004", name: "Pangsit Goreng", price: 16000, stock: 25, minStock: 8, unit: "porsi", image: IMG("photo-1496116218417-1a781b1c416c") },
    { code: "AP-005", name: "Salad Sayur", price: 21000, stock: 12, minStock: 6, unit: "porsi", image: IMG("photo-1512621776951-a57141f2eefd") },
  ],
  Minuman: [
    { code: "MN-001", name: "Es Teh Manis", price: 6000, stock: 200, minStock: 30, unit: "gelas", image: IMG("photo-1499638673689-79a0b5115d87") },
    { code: "MN-002", name: "Es Jeruk", price: 8000, stock: 9, minStock: 20, unit: "gelas", image: IMG("photo-1613478223719-2ab802602423") },
    { code: "MN-003", name: "Kopi Susu Gula Aren", price: 18000, stock: 60, minStock: 15, unit: "gelas", image: IMG("photo-1461023058943-07fcbe16d735") },
    { code: "MN-004", name: "Jus Alpukat", price: 20000, stock: 0, minStock: 10, unit: "gelas", image: IMG("photo-1623065422902-30a2d299bbe4") },
    { code: "MN-005", name: "Air Mineral", price: 5000, stock: 150, minStock: 30, unit: "gelas", image: IMG("photo-1523362628745-0c100150b504") },
    { code: "MN-006", name: "Teh Tarik", price: 15000, stock: 40, minStock: 12, unit: "gelas", image: IMG("photo-1571934811356-5cc061b6821f") },
  ],
};

const CATEGORY_SLUG: Record<string, string> = {
  "Makanan Utama": "makanan-utama",
  Appetizer: "appetizer",
  Minuman: "minuman",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("🌱 Mulai seeding...");

  // Bersihkan data (urutan sesuai relasi)
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // Setting
  await prisma.setting.create({
    data: {
      restaurantName: "Dapur Bu Aina",
      tagline: "Citarasa Warisan Keluarga",
    },
  });

  // Users
  const adminHash = await bcrypt.hash("admin123", 10);
  const kasirHash = await bcrypt.hash("kasir123", 10);
  const admin = await prisma.user.create({
    data: { name: "Bu Aina", username: "admin", passwordHash: adminHash, role: "ADMIN" },
  });
  const kasir = await prisma.user.create({
    data: { name: "Budi Santoso", username: "kasir", passwordHash: kasirHash, role: "KASIR" },
  });
  console.log("✅ User: admin/admin123, kasir/kasir123");

  // Kategori + Produk
  const allProducts: { id: string; price: number; stock: number }[] = [];
  for (const [catName, products] of Object.entries(DATA)) {
    const category = await prisma.category.create({
      data: { name: catName, slug: CATEGORY_SLUG[catName] },
    });
    for (const p of products) {
      const created = await prisma.product.create({
        data: {
          code: p.code,
          name: p.name,
          categoryId: category.id,
          price: p.price,
          stock: p.stock,
          minStock: p.minStock,
          unit: p.unit,
          imageUrl: p.image,
        },
      });
      allProducts.push({ id: created.id, price: p.price, stock: p.stock });
      // stok awal sebagai movement IN
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          type: "IN",
          quantity: p.stock,
          stockBefore: 0,
          stockAfter: p.stock,
          note: "Stok awal (seed)",
          userId: admin.id,
        },
      });
    }
  }
  console.log(`✅ ${allProducts.length} produk pada 3 kategori`);

  // Setting untuk kalkulasi
  const setting = await prisma.setting.findFirst();
  const taxPct = setting?.taxPercent ?? 10;
  const svcPct = setting?.servicePercent ?? 5;

  // ~90 pesanan tersebar 30 hari terakhir
  const methods = ["CASH", "CASH", "CASH", "DEBIT", "CREDIT_CARD", "QRIS", "QRIS"] as const;
  let orderSeq = 1;
  const totalOrders = 92;
  const cashiers = [admin.id, kasir.id];

  for (let i = 0; i < totalOrders; i++) {
    const daysAgo = randInt(0, 29);
    const created = new Date();
    created.setDate(created.getDate() - daysAgo);
    created.setHours(randInt(10, 21), randInt(0, 59), randInt(0, 59), 0);

    const itemCount = randInt(1, 4);
    const chosen = new Map<string, number>();
    for (let j = 0; j < itemCount; j++) {
      const prod = pick(allProducts);
      chosen.set(prod.id, (chosen.get(prod.id) ?? 0) + randInt(1, 3));
    }

    const items = [...chosen.entries()].map(([id, qty]) => {
      const prod = allProducts.find((p) => p.id === id)!;
      return { productId: id, quantity: qty, price: prod.price, subtotal: prod.price * qty };
    });

    const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
    const tax = Math.round((subtotal * taxPct) / 100);
    const serviceCharge = Math.round((subtotal * svcPct) / 100);
    const total = subtotal + tax + serviceCharge;

    const isDineIn = Math.random() > 0.4;
    const method = pick([...methods]);
    const cashierId = pick(cashiers);

    const orderNumber = `#ORD-${String(orderSeq++).padStart(4, "0")}`;

    const productNames = await prisma.product.findMany({
      where: { id: { in: items.map((it) => it.productId) } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(productNames.map((p) => [p.id, p.name]));

    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderType: isDineIn ? "DINE_IN" : "TAKE_AWAY",
        tableNumber: isDineIn ? String(randInt(1, 20)) : null,
        customerName: isDineIn ? null : pick(["Rina", "Andi", "Siti", "Dewi", "Joko", "Maya"]),
        status: "PAID",
        subtotal,
        tax,
        serviceCharge,
        total,
        cashierId,
        createdAt: created,
        items: {
          create: items.map((it) => ({
            productId: it.productId,
            productName: nameMap.get(it.productId) ?? "Produk",
            price: it.price,
            quantity: it.quantity,
            subtotal: it.subtotal,
          })),
        },
      },
    });

    // Payment
    let amountPaid = total;
    let change = 0;
    if (method === "CASH") {
      const rounded = Math.ceil(total / 50000) * 50000;
      amountPaid = Math.random() > 0.5 ? rounded : total;
      change = amountPaid - total;
    }
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method,
        amountPaid,
        change,
        referenceNo:
          method === "CASH" ? null : `REF${randInt(100000, 999999)}`,
        cardLast4:
          method === "DEBIT" || method === "CREDIT_CARD"
            ? String(randInt(1000, 9999))
            : null,
        confirmedById: cashierId,
        paidAt: created,
      },
    });
  }
  console.log(`✅ ${totalOrders} pesanan + pembayaran (30 hari terakhir)`);
  console.log("🎉 Seeding selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Hindari warning "Prisma unused" pada beberapa konfigurasi lint
void Prisma;
