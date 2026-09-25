import { describe, expect, it } from "vitest";
import { getStockStatus, stockStatusLabel } from "@/lib/stock";
import { PRODUK, STOK_BATAS } from "./fixtures";

describe("U1 - Status stok", () => {
  it("U1-01 Jus Alpukat stok 0 / min 10 berstatus Habis", () => {
    const { stock, minStock } = PRODUK.jusAlpukat;
    expect(getStockStatus(stock, minStock)).toBe("HABIS");
  });

  it("U1-02 Es Jeruk stok 8 / min 20 berstatus Hampir Habis", () => {
    const { stock, minStock } = PRODUK.esJeruk;
    expect(getStockStatus(stock, minStock)).toBe("HAMPIR_HABIS");
  });

  it("U1-03 Air Mineral stok 200 / min 30 berstatus Aman", () => {
    const { stock, minStock } = PRODUK.airMineral;
    expect(getStockStatus(stock, minStock)).toBe("AMAN");
  });

  it("U1-04 [batas] stok sama dengan minimum (20/20) berstatus Hampir Habis", () => {
    expect(getStockStatus(STOK_BATAS.samaDenganMinimum, STOK_BATAS.minimum)).toBe("HAMPIR_HABIS");
  });

  it("U1-05 [batas] stok minimum + 1 (21/20) berstatus Aman", () => {
    expect(getStockStatus(STOK_BATAS.minimumPlusSatu, STOK_BATAS.minimum)).toBe("AMAN");
  });

  it("U1-06 [batas] stok 1 (di atas nol) dengan min 10 berstatus Hampir Habis", () => {
    expect(getStockStatus(1, 10)).toBe("HAMPIR_HABIS");
  });

  it("U1-07 [batas] stok minimum 0: stok 0 Habis, stok 1 Aman", () => {
    expect(getStockStatus(0, 0)).toBe("HABIS");
    expect(getStockStatus(1, 0)).toBe("AMAN");
  });

  it("U1-08 [salah] stok negatif (-1) tetap dianggap Habis", () => {
    expect(getStockStatus(-1, 10)).toBe("HABIS");
  });

  it("U1-09 label status berbahasa Indonesia sesuai tampilan", () => {
    expect(stockStatusLabel).toEqual({ AMAN: "Aman", HAMPIR_HABIS: "Hampir Habis", HABIS: "Habis" });
  });
});
