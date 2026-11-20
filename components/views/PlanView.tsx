"use client";

import { useState } from "react";
import { DOOMSDAY } from "@/lib/data";
import type { PlanDay } from "@/lib/planner";
import { fmtDur, weekday } from "@/lib/time";
import { useM } from "../ctx";
import DayCard from "../DayCard";

function weeks(days: PlanDay[]) {
  const out: PlanDay[][] = [];
  let cur: PlanDay[] = [];
  for (const d of days) {
    cur.push(d);
    if (weekday(d.date) === 0) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

const short = (iso: string) => `${Number(iso.slice(8))}.${Number(iso.slice(5, 7))}.`;

export default function PlanView() {
  const { plan, today } = useM();
  const [showPast, setShowPast] = useState(false);
  const all = weeks(plan.days.filter((d) => d.date <= DOOMSDAY));
  const late = plan.days.filter((d) => d.afterDoom && d.items.length);
  const pastCount = plan.days.filter((d) => d.past).length;
  const visible = all
    .map((w, i) => ({ w: w.filter((d) => showPast || !d.past), n: i + 1 }))
    .filter((x) => x.w.length);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-4">
        <h2 className="cap">Der Tagesplan</h2>
        {pastCount > 0 && (
          <button className="btn !text-base" onClick={() => setShowPast((v) => !v)}>
            {showPast ? "Vergangene Tage ausblenden" : `Vergangene Tage zeigen (${pastCount})`}
          </button>
        )}
      </div>
      <p className="cond mb-2 text-[15px] text-neutral-700">
        Der Plan verteilt alle offenen Titel automatisch der Reihe nach auf eure Zeitslots. Ändert ihr einen Slot, hakt etwas ab oder verschiebt einen Titel, rechnet er sofort neu.
      </p>

      {visible.map(({ w, n }) => (
        <section key={w[0].date}>
          <div className="mb-3 mt-8 flex items-center gap-3">
            <span className="comic bg-ink px-3 pt-1 text-2xl text-white">Woche {n}</span>
            <span className="cond text-base">
              {short(w[0].date)} – {short(w[w.length - 1].date)}
            </span>
            <span className="h-[3px] flex-1 bg-ink" />
            <span className="label hidden text-neutral-600 sm:inline">{fmtDur(w.reduce((s, d) => s + d.items.reduce((a, i) => a + i.t.mins, 0), 0))} Marvel</span>
          </div>
          <div className="flex flex-col gap-4">
            {w.map((d) => (
              <DayCard key={d.date} d={d} />
            ))}
          </div>
        </section>
      ))}

      {late.length > 0 && (
        <section className="mt-10">
          <div className="panel mb-4 bg-mred p-4 text-white" style={{ background: "var(--color-mred)" }}>
            <div className="comic text-3xl">Zu spät für Doomsday!</div>
            <div className="cond text-[16px]">
              Diese Titel passen nicht mehr vor den 23.12. Mehr Zeit einplanen, Slots verlängern oder Optionales streichen.
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {late.map((d) => (
              <DayCard key={d.date} d={d} />
            ))}
          </div>
        </section>
      )}
      {today > DOOMSDAY && <div className="h-4" />}
    </div>
  );
}
