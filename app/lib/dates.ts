/**
 * Calendar dates as YYYY-MM-DD in the device's local time zone. Don't derive
 * these with toISOString(): it uses UTC, so in Toronto the date would roll over
 * at 7 or 8 PM.
 */

function toLocalISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toLocalISO(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = new Date(iso + "T00:00:00");
  date.setDate(date.getDate() + days);
  return toLocalISO(date);
}
