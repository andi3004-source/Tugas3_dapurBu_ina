/** Zona waktu operasional restoran. Asia/Jakarta = UTC+7 tanpa daylight saving. */
export const APP_TIME_ZONE = "Asia/Jakarta";
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Komponen kalender (bulan 0–11) sebuah waktu menurut WIB, apa pun zona server. */
export function wibParts(date: Date): { year: number; month: number; day: number } {
  const shifted = new Date(date.getTime() + WIB_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

/** Buat Date dari jam dinding WIB (bulan 0–11; tanggal boleh overflow seperti `new Date`). */
export function wibDate(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0,
): Date {
  return new Date(Date.UTC(year, month, day, hours, minutes, seconds, ms) - WIB_OFFSET_MS);
}
