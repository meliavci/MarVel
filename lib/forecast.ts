import { START, TITLES, type Kind } from "./data";
import { buildPlan, lastMarathonDay, slotFor } from "./planner";
import { range, slotCap } from "./time";
import { settingsOf, type Doc } from "./state";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Scenario {
  label: string;
  drop: Kind[];
  probability: number;
  remainingMins: number;
}

export interface Forecast {
  probability: number; // 0..1, alles bis 22.12. geschafft
  scenarios: Scenario[];
  capacity: number; // Minuten Slot-Zeit bis 22.12. (ab heute)
  need: number; // Minuten inkl. Pausen
  buffer: number; // capacity * reliability - need
  daysLeft: number; // Tage mit Slot bis 22.12.
  perEvening: number; // nötige Minuten pro verfügbarem Abend
  pastCap: number;
  pastWatched: number;
  pace: number | null; // bisher genutzter Anteil eurer Slots
  dailyCaps: { date: string; cap: number }[];
}

const SIMS = 2500;
const START_SHARE = 0.6;

/** Simuliert viele mögliche Verläufe: Abende fallen mal aus, mal schaut ihr weniger als geplant. */
function simulate(caps: number[], queue: number[], reliability: number, skipChance: number, breakMin: number, seed: number) {
  if (!queue.length) return 1;
  const rnd = mulberry32(seed);
  let ok = 0;
  for (let s = 0; s < SIMS; s++) {
    let qi = 0;
    for (let d = 0; d < caps.length && qi < queue.length; d++) {
      if (caps[d] <= 0 || rnd() < skipChance) continue;
      const u1 = Math.max(rnd(), 1e-9);
      const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rnd());
      const real = caps[d] * Math.min(1.1, Math.max(0.3, reliability + g * 0.15));
      let used = 0;
      let first = true;
      while (qi < queue.length) {
        const need = queue[qi] + (first ? 0 : breakMin);
        // Ihr fangt einen Titel an, wenn noch mind. 60 % davon in den Abend passen – und schaut ihn dann zu Ende.
        if (used + START_SHARE * need <= real) {
          used += need;
          first = false;
          qi++;
        } else break;
      }
    }
    if (qi >= queue.length) ok++;
  }
  return ok / SIMS;
}

export function buildForecast(doc: Doc, today: string): Forecast {
  const st = settingsOf(doc);
  const plan = buildPlan(doc, today);
  const from = today < START ? START : today;
  const watchedToday = TITLES.filter((t) => doc.watched[t.id] === from).reduce((s, t) => s + t.mins, 0);
  const dailyCaps = from <= lastMarathonDay
    ? range(from, lastMarathonDay).map((date) => {
        const c = slotCap(slotFor(doc, date).slot);
        return { date, cap: date === from ? Math.max(0, c - watchedToday) : c };
      })
    : [];
  const caps = dailyCaps.map((d) => d.cap);
  const capacity = caps.reduce((a, b) => a + b, 0);
  const daysLeft = caps.filter((c) => c > 0).length;

  const queueFor = (drop: Kind[]) => plan.remaining.filter((t) => !drop.includes(t.kind)).map((t) => t.mins);
  const needOf = (q: number[]) => q.reduce((a, b) => a + b, 0) + Math.max(0, q.length - daysLeft) * st.breakMin;

  const base = queueFor([]);
  const need = needOf(base);
  const seed = 1234 + base.length * 7 + Math.round(capacity);
  const probability = simulate(caps, base, st.reliability, st.skipChance, st.breakMin, seed);

  const scenarios: Scenario[] = [
    { label: "Alles schauen", drop: [] },
    { label: "Ohne Optionales", drop: ["opt"] },
    { label: "Ohne Optional + Bonus", drop: ["opt", "bonus"] },
  ].map((sc) => {
    const q = queueFor(sc.drop as Kind[]);
    return {
      label: sc.label,
      drop: sc.drop as Kind[],
      probability: sc.drop.length ? simulate(caps, q, st.reliability, st.skipChance, st.breakMin, seed) : probability,
      remainingMins: q.reduce((a, b) => a + b, 0),
    };
  });

  // Bisheriges Tempo: wie viel eurer vergangenen Slots habt ihr wirklich genutzt?
  let pastCap = 0;
  let pastWatched = 0;
  if (from > START) {
    for (const date of range(START, from).slice(0, -1)) {
      pastCap += slotCap(slotFor(doc, date).slot);
      pastWatched += TITLES.filter((t) => doc.watched[t.id] === date).reduce((s, t) => s + t.mins, 0);
    }
  }

  return {
    probability,
    scenarios,
    capacity,
    need,
    buffer: Math.round(capacity * st.reliability - need),
    daysLeft,
    perEvening: daysLeft ? Math.round(need / daysLeft) : need,
    pastCap,
    pastWatched,
    pace: pastCap > 0 ? pastWatched / pastCap : null,
    dailyCaps,
  };
}
