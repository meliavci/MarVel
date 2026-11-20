"use client";

import { DOOMSDAY } from "@/lib/data";
import { addDays, fmtDate, fmtDateLong, fmtDur } from "@/lib/time";
import { useM } from "../ctx";
import DayCard from "../DayCard";
import { daysUntilDoom, Gauge, statusOf } from "../ui";

export default function TodayView() {
  const { plan, forecast, today, go, doc } = useM();
  const d = plan.byDate[today];
  const st = statusOf(forecast.probability);
  const upcoming = plan.days.filter((x) => x.date > today && x.items.some((i) => i.status === "planned")).slice(0, 4);
  const left = daysUntilDoom(today);
  const next = plan.remaining[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <h2 className="cap">{today === DOOMSDAY ? "Doomsday!" : "Heute"}</h2>
          <span className="cond text-lg">{fmtDateLong(today)}</span>
        </div>
        {d ? (
          <DayCard d={d} />
        ) : (
          <div className="panel p-5 text-lg font-semibold">
            {today < "2026-11-20" ? "Der Marathon startet am 20. November." : doc.watched.doom ? "Marathon beendet. Excelsior!" : "Doomsday ist vorbei – habt ihr es geschafft?"}
          </div>
        )}
        <p className="cond mt-4 text-[15px] text-neutral-700">
          Nicht geschafft? Einfach nicht abhaken – offene Titel rutschen morgen automatisch auf den nächsten freien Abend. Mit „Verschieben“ legt ihr einen Titel fest auf einen bestimmten Tag.
        </p>

        {upcoming.length > 0 && (
          <>
            <h3 className="comic mb-3 mt-8 text-[26px]">Als Nächstes</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {upcoming.map((u) => (
                <button key={u.date} onClick={() => go("plan", u.date)} className="panel-sm p-3 text-left transition hover:-translate-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="comic text-xl">{u.date === addDays(today, 1) ? "Morgen" : fmtDate(u.date)}</span>
                    <span className="label text-neutral-500">{fmtDur(u.items.reduce((s, i) => s + i.t.mins, 0))}</span>
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {u.items.map((i) => (
                      <li key={i.t.id} className="cond text-[15px] leading-tight">
                        {i.pinned ? "📌 " : "▸ "}
                        {i.t.short}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <aside className="flex flex-col gap-5">
        <div className="panel bg-ink p-4 text-white" style={{ background: "#111" }}>
          <div className="label text-myellow">Countdown</div>
          <div className="comic text-[56px] leading-none">{left > 0 ? left : left === 0 ? "Heute!" : "✔"}</div>
          <div className="label">{left === 1 ? "Tag" : "Tage"} bis Doomsday · 23.12.</div>
        </div>
        <button onClick={() => go("prognose")} className="panel p-4 text-left">
          <div className="label">Schaffen wir das?</div>
          <div className="flex justify-center">
            <Gauge p={forecast.probability} size={230} />
          </div>
          <div className="comic text-center text-2xl" style={{ color: st.color }}>
            {st.label}
          </div>
          <div className="cond text-center text-[15px]">{st.text}</div>
          <div className="cond mt-2 text-center text-[14px] text-neutral-600">
            Laut Plan fertig: {plan.late.length ? <b className="text-mred">zu spät ({plan.late.length} Titel nach Doomsday)</b> : plan.finish ? fmtDate(plan.finish) : "alles geschaut!"}
          </div>
        </button>
        {next && (
          <div className="panel-sm p-4">
            <div className="label">Nächster offener Titel</div>
            <div className="mt-1 text-lg font-bold leading-tight">{next.title}</div>
            <div className="cond text-neutral-600">
              {fmtDur(next.mins)} · geplant {plan.plannedOn[next.id] ? fmtDate(plan.plannedOn[next.id]) : "–"}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
