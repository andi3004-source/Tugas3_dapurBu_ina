import type { PaymentMethod } from "@prisma/client";

export type Billing = {
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
};

/** Hitung pajak & service (dibulatkan ke rupiah terdekat) dari subtotal. */
export function calculateCharges(
  subtotal: number,
  taxPercent: number,
  servicePercent: number,
): Billing {
  const tax = Math.round((subtotal * taxPercent) / 100);
  const serviceCharge = Math.round((subtotal * servicePercent) / 100);
  return { subtotal, tax, serviceCharge, total: subtotal + tax + serviceCharge };
}

export function lineSubtotal(price: number, quantity: number): number {
  return price * quantity;
}

/** Hitung billing lengkap dari daftar item (harga × qty). */
export function calculateBilling(
  items: { price: number; quantity: number }[],
  taxPercent: number,
  servicePercent: number,
): Billing {
  const subtotal = items.reduce((s, it) => s + lineSubtotal(it.price, it.quantity), 0);
  return calculateCharges(subtotal, taxPercent, servicePercent);
}

/** Pembayaran tunai: cukup bila uang ≥ total; kembalian = uang − total. */
export function calculateCashPayment(
  total: number,
  cash: number,
): { enough: boolean; change: number; shortfall: number } {
  const enough = cash >= total;
  return {
    enough,
    change: enough ? cash - total : 0,
    shortfall: enough ? 0 : total - cash,
  };
}

export type PaymentIssue = "CASH_SHORT" | "CARD_LAST4_INVALID" | "QRIS_REF_REQUIRED";

/** Validasi input pembayaran di sisi kasir sebelum dikonfirmasi. */
export function validatePaymentInput(
  method: PaymentMethod,
  input: { total: number; cash?: number; cardLast4?: string; referenceNo?: string },
): PaymentIssue | null {
  if (method === "CASH" && !calculateCashPayment(input.total, input.cash ?? 0).enough) {
    return "CASH_SHORT";
  }
  if ((method === "DEBIT" || method === "CREDIT_CARD") && !/^\d{4}$/.test(input.cardLast4 ?? "")) {
    return "CARD_LAST4_INVALID";
  }
  if (method === "QRIS" && !(input.referenceNo ?? "").trim()) return "QRIS_REF_REQUIRED";
  return null;
}
