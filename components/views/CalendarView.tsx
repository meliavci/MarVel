"use client";

import { useState } from "react";
import { DOOMSDAY, START } from "@/lib/data";
import { addDays, dayNum, fmtDur, MON, monIdx, weekday } from "@/lib/time";
import { useM } from "../ctx";
import DayCard, { dayDone } from "../DayCard";

export default function CalendarView() {
  const { plan, today, doc } = useM();
  const [sel, setSel] = useState<string>(today >= START && today <= DOOMSDAY ? today : START);
  // Raster ab Montag der Startwoche bis Doomsday-Woche bzw. letzter geplanter Tag
  const lastDate = plan.days[plan.days.length - 1].date;
  let first = START;
  while (weekday(first) !== 1) first = addDays(first, -1);
  let last = lastDate > DOOMSDAY ? lastDate : DOOMSDAY;
  while (weekday(last) !== 0) last = addDays(last, 1);
  const cells: string[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) cells.push(d);
  const selDay = plan.byDate[sel];

  return (
    <div>
      <h2 className="cap mb-3">Der Kalender</h2>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] font-semibold">
        <span>
          <span className="tag tag-core">Kern</span> muss
        </span>
        <span>
          <span className="tag tag-bonus">Bonus</span> „besser wenn“
        </span>
        <span>
          <span className="tag tag-opt">Optional</span> zuerst streichen
        </span>
        <span>
          <span className="tag bg-white">📌</span> fest verschoben
        </span>
        <span>
          <span className="tag" style={{ background: "#c9f0d8" }}>
            ✔
          </span>{" "}
          geschaut
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {["MO", "DI", "MI", "DO", "FR", "SA", "SO"].map((x) => (
          <div key={x} className="comic text-center text-lg sm:text-xl">
            {x}
          </div>
        ))}
        {cells.map((iso) => {
          const d = plan.byDate[iso];
          if (!d) return <div key={iso} />;
          const off = d.slot === "off" && !d.isDoom;
          const done = d.isDoom ? !!doc.watched.doom : dayDone(d, doc.watched);
          const mins = d.items.reduce((s, i) => s + i.t.mins, 0);
          return (
            <button
              key={iso}
              onClick={() => setSel(iso)}
              className={`relative flex min-h-[64px] min-w-0 flex-col gap-1 border-[2.5px] p-1 text-left transition sm:min-h-[112px] sm:p-1.5 ${
                d.isDoom
                  ? "border-ink bg-doom text-white shadow-[3px_3px_0_#111]"
                  : off
                    ? "hatched border-neutral-500"
                    : done
                      ? "border-ink bg-[#e9f9ef] shadow-[3px_3px_0_#111]"
                      : d.afterDoom
                        ? "border-mred bg-[#ffe1e2] shadow-[3px_3px_0_#b0121a]"
                        : "border-ink bg-white shadow-[3px_3px_0_#111]"
              } ${d.slotLabel === "München" ? "border-t-[7px] !border-t-mblue" : ""} ${sel === iso ? "outline-[3px] outline-offset-2 outline-mred" : ""} ${
                iso === today ? "ring-4 ring-myellow" : ""
              }`}
            >
              <div className="flex items-baseline gap-1">
                <span className={`comic text-lg leading-none sm:text-2xl ${off ? "text-neutral-500" : ""}`}>{dayNum(iso)}</span>
                <span className="label hidden !text-[10.5px] text-current opacity-60 sm:inline">{MON[monIdx(iso)]}</span>
                {done && <span className="ml-auto text-sm font-black text-mgreen">✔</span>}
              </div>
              {d.isDoom ? (
                <span className="comic bg-myellow px-1 text-center text-[11px] text-ink sm:text-base">Doom</span>
              ) : (
                <>
                  <div className="hidden flex-col gap-1 sm:flex">
                    {d.items.map((i) => (
                      <span
                        key={i.t.id}
                        className={`cond break-words border-[1.5px] border-ink px-1 py-px text-[12.5px] leading-tight ${
                          doc.watched[i.t.id] ? "bg-[#c9f0d8] text-[#3d6b4f] line-through" : i.t.kind === "bonus" ? "bg-[#fff2a8]" : i.t.kind === "opt" ? "bg-[#ececec]" : "bg-[#ffe1e2]"
                        }`}
                      >
                        {i.pinned ? "📌 " : ""}
                        {i.t.short}
                      </span>
                    ))}
                    {!d.items.length && <span className="label !text-[11px] text-neutral-500">{off ? d.slotLabel : "frei"}</span>}
                  </div>
                  <div className="flex flex-wrap gap-0.5 sm:hidden">
                    {d.items.map((i) => (
                      <i key={i.t.id} className={`block h-2 w-2 border border-ink ${doc.watched[i.t.id] ? "bg-mgreen" : "bg-mred"}`} />
                    ))}
                  </div>
                  {mins > 0 && <span className="label mt-auto hidden !text-[10.5px] text-neutral-500 sm:block">{fmtDur(mins)}</span>}
                </>
              )}
            </button>
          );
        })}
      </div>
      {selDay && (
        <div className="mt-8">
          <h3 className="comic mb-3 text-[26px]">Ausgewählter Tag</h3>
          <DayCard d={selDay} />
        </div>
      )}
    </div>
  );
}
