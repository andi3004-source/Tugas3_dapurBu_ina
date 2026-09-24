import type { OrderType, OrderStatus, PaymentMethod } from "@prisma/client";

export const orderTypeLabel: Record<OrderType, string> = {
  DINE_IN: "Dine In",
  TAKE_AWAY: "Take Away",
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING: "Menunggu",
  PAID: "Lunas",
  CANCELLED: "Dibatalkan",
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CASH: "Tunai",
  DEBIT: "Kartu Debit",
  CREDIT_CARD: "Kartu Kredit",
  QRIS: "QRIS",
};
