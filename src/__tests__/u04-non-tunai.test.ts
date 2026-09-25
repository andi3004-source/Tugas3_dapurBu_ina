import { describe, expect, it } from "vitest";
import { validatePaymentInput } from "@/lib/billing";
import { paymentSchema } from "@/lib/validations";
import { MEJA_12_BILLING } from "./fixtures";

const TOTAL = MEJA_12_BILLING.total;
const base = { orderId: "ord-meja-12", amountPaid: TOTAL };

function firstError(input: Record<string, unknown>) {
  const res = paymentSchema.safeParse({ ...base, ...input });
  return res.success ? null : res.error.issues[0].message;
}

describe("U4 - Validasi pembayaran non tunai", () => {
  it("U4-01 QRIS dengan nomor referensi diterima", () => {
    expect(firstError({ method: "QRIS", referenceNo: "QR20260925001" })).toBeNull();
    expect(validatePaymentInput("QRIS", { total: TOTAL, referenceNo: "QR20260925001" })).toBeNull();
  });

  it("U4-02 [salah] QRIS tanpa nomor referensi ditolak", () => {
    expect(firstError({ method: "QRIS" })).toBe("Nomor referensi wajib diisi");
    expect(validatePaymentInput("QRIS", { total: TOTAL })).toBe("QRIS_REF_REQUIRED");
  });

  it("U4-03 [salah] QRIS dengan nomor referensi berisi spasi saja ditolak", () => {
    expect(firstError({ method: "QRIS", referenceNo: "   " })).toBe("Nomor referensi wajib diisi");
    expect(validatePaymentInput("QRIS", { total: TOTAL, referenceNo: "   " })).toBe("QRIS_REF_REQUIRED");
  });

  it("U4-04 Kartu Debit dengan 4 digit terakhir 1234 diterima", () => {
    expect(firstError({ method: "DEBIT", cardLast4: "1234", referenceNo: "001234" })).toBeNull();
    expect(validatePaymentInput("DEBIT", { total: TOTAL, cardLast4: "1234" })).toBeNull();
  });

  it("U4-05 [batas] Kartu Debit 3 digit (123) dan 5 digit (12345) ditolak", () => {
    expect(firstError({ method: "DEBIT", cardLast4: "123" })).toBe("4 digit terakhir kartu wajib diisi");
    expect(firstError({ method: "DEBIT", cardLast4: "12345" })).toBe("4 digit terakhir kartu wajib diisi");
    expect(validatePaymentInput("DEBIT", { total: TOTAL, cardLast4: "123" })).toBe("CARD_LAST4_INVALID");
    expect(validatePaymentInput("DEBIT", { total: TOTAL, cardLast4: "12345" })).toBe("CARD_LAST4_INVALID");
  });

  it("U4-06 [salah] Kartu Kredit dengan huruf (12a4) ditolak", () => {
    expect(firstError({ method: "CREDIT_CARD", cardLast4: "12a4" })).toBe("4 digit terakhir kartu wajib diisi");
    expect(validatePaymentInput("CREDIT_CARD", { total: TOTAL, cardLast4: "12a4" })).toBe("CARD_LAST4_INVALID");
  });

  it("U4-07 [salah] Kartu Kredit tanpa 4 digit terakhir ditolak", () => {
    expect(firstError({ method: "CREDIT_CARD" })).toBe("4 digit terakhir kartu wajib diisi");
    expect(validatePaymentInput("CREDIT_CARD", { total: TOTAL })).toBe("CARD_LAST4_INVALID");
  });

  it("U4-08 Kartu Kredit 4 digit valid diterima (nomor referensi opsional)", () => {
    expect(firstError({ method: "CREDIT_CARD", cardLast4: "9876" })).toBeNull();
  });

  it("U4-09 tunai tidak memerlukan nomor referensi maupun 4 digit kartu", () => {
    expect(firstError({ method: "CASH" })).toBeNull();
  });

  it("U4-10 [salah] metode pembayaran tidak dikenal (OVO) ditolak", () => {
    expect(paymentSchema.safeParse({ ...base, method: "OVO" }).success).toBe(false);
  });
});
