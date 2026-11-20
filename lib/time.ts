import { DEFAULT_OVERRIDES, type Slot } from "./data";

export const WD_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
export const WD_LONG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
export const MON = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

const toUTC = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d, 12);
};
export const addDays = (iso: string, n: number) => new Date(toUTC(iso) + n * 86400000).toISOString().slice(0, 10);
export const dayDiff = (a: string, b: string) => Math.round((toUTC(b) - toUTC(a)) / 86400000);
export const weekday = (iso: string) => new Date(toUTC(iso)).getUTCDay();
export const dayNum = (iso: string) => Number(iso.slice(8, 10));
export const monIdx = (iso: string) => Number(iso.slice(5, 7)) - 1;

export const fmtDate = (iso: string) => `${WD_SHORT[weekday(iso)]} ${dayNum(iso)}.${monIdx(iso) + 1}.`;
export const fmtDateLong = (iso: string) => `${WD_LONG[weekday(iso)]}, ${dayNum(iso)}. ${MON[monIdx(iso)]}`;

export function range(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Aktuelle Zeit in Berlin. Bis 5 Uhr morgens zählt noch zum Vortag (Filmabende gehen über Mitternacht). */
export function berlinNow(): { today: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const iso = `${g("year")}-${g("month")}-${g("day")}`;
  const mins = Number(g("hour")) * 60 + Number(g("minute"));
  return mins < 5 * 60 ? { today: addDays(iso, -1), minutes: mins + 1440 } : { today: iso, minutes: mins };
}

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const minToClock = (m: number) => {
  const x = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
};
export const fmtDur = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return h ? `${h}h ${String(mm).padStart(2, "0")}` : `${mm} Min`;
};

export function slotCap(slot: Slot): number {
  if (slot === "off") return 0;
  const s = toMin(slot.s);
  let e = toMin(slot.e);
  if (e <= s) e += 1440;
  return e - s;
}

/** Standard-Slot nach euren Angaben: Mo–Mi kurz, Do–Sa lang, So mittel */
export function defaultSlot(iso: string): { slot: Slot; label: string } {
  const o = DEFAULT_OVERRIDES[iso];
  if (o) return o;
  const wd = weekday(iso);
  if (wd >= 1 && wd <= 3) return { slot: { s: "21:30", e: "00:00" }, label: "Arbeitstag" };
  if (wd === 0) return { slot: { s: "21:30", e: "01:00" }, label: "Sonntag" };
  return { slot: { s: "21:30", e: "02:00" }, label: "Abend" };
}
