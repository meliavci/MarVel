import { DOOMSDAY, START, TITLES, type Slot, type Title } from "./data";
import { addDays, defaultSlot, range, slotCap, toMin } from "./time";
import { settingsOf, type Doc } from "./state";

export const FIT_TOLERANCE = 10; // so viele Minuten darf ein Abend überziehen

export interface PlanItem {
  t: Title;
  status: "watched" | "planned";
  pinned: boolean;
  start?: number; // Minuten ab Mitternacht des Tages (kann > 1440 sein)
  end?: number;
}

export interface PlanDay {
  date: string;
  slot: Slot;
  slotLabel: string;
  custom: boolean;
  cap: number;
  used: number;
  items: PlanItem[];
  over: boolean;
  past: boolean;
  isToday: boolean;
  isDoom: boolean;
  afterDoom: boolean;
}

export interface Plan {
  today: string;
  days: PlanDay[];
  byDate: Record<string, PlanDay>;
  plannedOn: Record<string, string>; // titelId -> geplantes Datum
  late: Title[]; // landen erst nach Doomsday
  finish: string | null; // letzter Marathon-Tag laut Plan
  remaining: Title[];
  remainingMins: number;
}

export const lastMarathonDay = addDays(DOOMSDAY, -1);

export function slotFor(doc: Doc, date: string): { slot: Slot; label: string; custom: boolean } {
  const stored = doc.slots[date];
  const def = defaultSlot(date);
  if (stored !== undefined) return { slot: stored, label: stored === "off" ? "Keine Zeit" : "Eigener Slot", custom: true };
  return { ...def, custom: false };
}

export function buildPlan(doc: Doc, today: string): Plan {
  const { breakMin } = settingsOf(doc);
  const watchedIds = new Set(Object.keys(doc.watched));
  const remaining = TITLES.filter((t) => !watchedIds.has(t.id) && !doc.skipped[t.id]);
  const remainingMins = remaining.reduce((s, t) => s + t.mins, 0);

  const days: PlanDay[] = [];
  const byDate: Record<string, PlanDay> = {};
  const mk = (date: string): PlanDay => {
    const { slot, label, custom } = slotFor(doc, date);
    const isDoom = date === DOOMSDAY;
    const d: PlanDay = {
      date,
      slot: isDoom ? "off" : slot,
      slotLabel: isDoom ? "Doomsday" : label,
      custom,
      cap: isDoom ? 0 : slotCap(slot),
      used: 0,
      items: [],
      over: false,
      past: date < today,
      isToday: date === today,
      isDoom,
      afterDoom: date > DOOMSDAY,
    };
    days.push(d);
    byDate[date] = d;
    return d;
  };
  const firstDay = today < START ? START : today;
  for (const date of range(START, DOOMSDAY)) mk(date);

  // 1) Geschautes an seinem Tag eintragen
  for (const t of TITLES) {
    const w = doc.watched[t.id];
    if (!w) continue;
    const d = byDate[w] ?? mk(w);
    d.used += (d.items.length ? breakMin : 0) + t.mins;
    d.items.push({ t, status: "watched", pinned: false });
  }

  // 2) Fest verschobene Titel (Pins) auf ihren Tag legen
  const plannedOn: Record<string, string> = {};
  const queue: Title[] = [];
  for (const t of remaining) {
    const p = doc.pins[t.id];
    if (p && p >= firstDay) {
      const d = byDate[p] ?? mk(p);
      d.used += (d.items.length ? breakMin : 0) + t.mins;
      d.items.push({ t, status: "planned", pinned: true });
      plannedOn[t.id] = p;
    } else queue.push(t);
  }

  // 3) Rest der Reihe nach auf die freien Abende verteilen
  let date = firstDay;
  let guard = 0;
  while (queue.length && guard++ < 150) {
    const d = byDate[date] ?? mk(date);
    if (!d.isDoom && d.cap > 0) {
      while (queue.length) {
        const t = queue[0];
        const need = t.mins + (d.items.length ? breakMin : 0);
        if (d.used + need <= d.cap + FIT_TOLERANCE) {
          d.items.push({ t, status: "planned", pinned: false });
          d.used += need;
          plannedOn[t.id] = date;
          queue.shift();
        } else break;
      }
    }
    date = addDays(date, 1);
  }

  // Reihenfolge innerhalb des Tages: Geschautes zuerst, dann Plan in Marathon-Reihenfolge
  const order = Object.fromEntries(TITLES.map((t, i) => [t.id, i]));
  let finish: string | null = null;
  for (const d of days) {
    d.items.sort((a, b) => (a.status === b.status ? order[a.t.id] - order[b.t.id] : a.status === "watched" ? -1 : 1));
    d.over = d.used > d.cap + FIT_TOLERANCE && d.items.some((i) => i.status === "planned");
    if (d.slot !== "off") {
      let clock = toMin(d.slot.s);
      for (const it of d.items) {
        it.start = clock;
        it.end = clock + it.t.mins;
        clock = it.end + breakMin;
      }
    }
    if (d.items.some((i) => i.status === "planned") && (!finish || d.date > finish)) finish = d.date;
  }
  days.sort((a, b) => (a.date < b.date ? -1 : 1));
  const late = remaining.filter((t) => (plannedOn[t.id] ?? "9999") > lastMarathonDay);

  return { today, days, byDate, plannedOn, late, finish, remaining, remainingMins };
}
