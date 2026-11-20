"use client";

import { DOOMSDAY_MINS } from "@/lib/data";
import type { PlanDay } from "@/lib/planner";
import { dayNum, fmtDur, MON, monIdx, WD_SHORT, weekday } from "@/lib/time";
import { useM } from "./ctx";
import { NoteField, SlotPicker, slotText, TitleLine } from "./ui";

export function dayDone(d: PlanDay, watched: Record<string, string>) {
  return d.items.length > 0 && d.items.every((i) => watched[i.t.id]);
}

export default function DayCard({ d }: { d: PlanDay }) {
  const { doc, update, today } = useM();
  const done = d.isDoom ? !!doc.watched.doom : dayDone(d, doc.watched);
  const off = d.slot === "off";
  const planned = d.items.filter((i) => i.status === "planned");
  const watchedMins = d.items.filter((i) => i.status === "watched").reduce((s, i) => s + i.t.mins, 0);

  const dateBg = d.isDoom
    ? "bg-steel text-ink"
    : done
      ? "bg-mgreen text-white"
      : off
        ? "bg-neutral-400 text-white"
        : d.past
          ? "bg-neutral-700 text-white"
          : d.slotLabel === "München"
            ? "bg-mblue text-white"
            : "bg-mred text-white";

  return (
    <article
      id={`day-${d.date}`}
      className={`grid scroll-mt-28 grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)_270px] ${
        d.isDoom ? "panel !bg-doom text-white" : off && !d.items.length ? "hatched border-[3px] border-neutral-500 shadow-[3px_3px_0_#777]" : "panel"
      } ${d.isToday ? "outline-[4px] outline-offset-4 outline-myellow" : ""}`}
    >
      {/* Datum */}
      <div className={`flex items-center gap-3 border-b-[3px] border-ink px-4 py-2 md:flex-col md:justify-center md:gap-0.5 md:border-b-0 md:border-r-[3px] md:px-2 md:py-3 md:text-center ${dateBg}`}>
        <div className="comic text-2xl leading-none">{WD_SHORT[weekday(d.date)].toUpperCase()}</div>
        <div className="font-logo text-4xl leading-none md:text-5xl">{dayNum(d.date)}</div>
        <div className="label !text-[13px]">{MON[monIdx(d.date)]}</div>
        <div className="label ml-auto border-2 border-ink bg-white px-1.5 py-0.5 !text-[11px] leading-tight text-ink md:ml-0 md:mt-1.5">
          {d.isToday ? "Heute" : d.slotLabel}
        </div>
      </div>

      {/* Inhalt */}
      <div className="flex min-w-0 flex-col gap-3 px-4 py-3.5 md:px-5">
        {d.isDoom ? (
          <>
            <div className="stroke-title text-[40px] md:text-[50px]" style={{ WebkitTextStroke: "2px #111" }}>
              Avengers:
              <br />
              Doomsday
            </div>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="chk"
                checked={!!doc.watched.doom}
                onChange={(e) => update({ k: "watched.doom", v: e.target.checked ? d.date : null })}
              />
              <span className="text-[17px] font-bold">Doomsday geschaut – Marathon beendet! · ca. {fmtDur(DOOMSDAY_MINS)}</span>
            </label>
          </>
        ) : (
          <>
            <div className="cond flex flex-wrap items-center gap-x-3 gap-y-1 text-[17px]">
              {off ? (
                <span className="comic text-2xl text-neutral-600">Keine Marvel-Zeit</span>
              ) : (
                <>
                  <span>{slotText(d.slot)} Uhr</span>
                  <span className="bg-ink px-2 text-[14px] text-white">
                    {fmtDur(d.items.reduce((s, i) => s + i.t.mins, 0))} / {fmtDur(d.cap)}
                  </span>
                </>
              )}
              {d.over && <span className="tag bg-mred text-white">Überbucht</span>}
              {done && <span className="burst text-lg">Geschafft!</span>}
            </div>
            {d.items.length ? (
              <div className="flex flex-col gap-3">
                {d.items.map((it) => (
                  <TitleLine key={it.t.id} item={it} date={d.date} />
                ))}
              </div>
            ) : d.past ? (
              <div className="font-semibold text-neutral-500">Nichts geschaut – offene Titel sind automatisch weitergewandert.</div>
            ) : !off ? (
              <div className="font-semibold text-neutral-500">Noch frei. Hier landet, was sich nach hinten schiebt.</div>
            ) : (
              <div className="font-semibold text-neutral-500">{d.date === today ? "Doch Zeit? Rechts einen Slot wählen." : "Rechts einen Slot wählen, falls ihr doch Zeit habt."}</div>
            )}
            {planned.length > 0 && watchedMins > 0 && <div className="cond text-sm text-neutral-500">Startzeiten gerechnet ab Slot-Beginn inkl. bereits Geschautem.</div>}
          </>
        )}
      </div>

      {/* Seite */}
      <div className={`flex flex-col gap-2.5 border-t-[3px] border-ink px-4 py-3 md:border-l-[3px] md:border-t-0 ${d.isDoom ? "bg-[#163b22] text-white" : "bg-paper2"}`}>
        {!d.isDoom && !d.past && (
          <div>
            <div className="label mb-1">Zeitslot</div>
            <SlotPicker date={d.date} />
          </div>
        )}
        <div>
          <div className="label mb-1">Notiz</div>
          <NoteField date={d.date} />
        </div>
      </div>
    </article>
  );
}
