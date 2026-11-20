"use client";

import { useState } from "react";
import { TITLES } from "@/lib/data";
import { lastMarathonDay } from "@/lib/planner";
import { fmtDate, fmtDur } from "@/lib/time";
import { useM } from "../ctx";
import { KindTag, MoveSelect } from "../ui";

type Filter = "alle" | "offen" | "geschaut" | "gestrichen";

export default function TitlesView() {
  const { doc, plan, update, today, go } = useM();
  const [filter, setFilter] = useState<Filter>("alle");
  const status = (id: string) => (doc.watched[id] ? "geschaut" : doc.skipped[id] ? "gestrichen" : "offen");
  const list = TITLES.filter((t) => filter === "alle" || status(t.id) === filter);
  const sum = (f: Filter) => TITLES.filter((t) => f === "alle" || status(t.id) === f).reduce((s, t) => s + t.mins, 0);
  const count = (f: Filter) => TITLES.filter((t) => f === "alle" || status(t.id) === f).length;

  return (
    <div>
      <h2 className="cap mb-3">Alle Titel</h2>
      <p className="cond mb-4 text-[15px] text-neutral-700">In Marathon-Reihenfolge. Hier könnt ihr abhaken, Titel fest auf einen Tag legen oder streichen.</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {(["alle", "offen", "geschaut", "gestrichen"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`btn !text-base capitalize ${filter === f ? "btn-red" : ""}`}>
            {f} · {count(f)} <span className="cond text-sm opacity-80">({fmtDur(sum(f))})</span>
          </button>
        ))}
      </div>
      <div className="panel divide-y-2 divide-ink">
        {list.map((t) => {
          const s = status(t.id);
          const pDate = plan.plannedOn[t.id];
          const late = pDate && pDate > lastMarathonDay;
          const n = TITLES.indexOf(t) + 1;
          return (
            <div key={t.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:flex-nowrap ${s === "gestrichen" ? "bg-neutral-100 opacity-70" : ""}`}>
              <span className="comic w-8 shrink-0 text-center text-2xl text-neutral-400">{n}</span>
              <input
                type="checkbox"
                className="chk"
                checked={s === "geschaut"}
                disabled={s === "gestrichen"}
                aria-label={`${t.title} geschaut`}
                onChange={(e) =>
                  update(e.target.checked ? [{ k: `watched.${t.id}`, v: today }, { k: `pins.${t.id}`, v: null }] : { k: `watched.${t.id}`, v: null })
                }
              />
              <div className="min-w-0 flex-1 basis-48">
                <div className={`font-bold leading-tight ${s !== "offen" ? "text-neutral-500 line-through" : ""}`}>{t.title}</div>
                <div className="cond mt-0.5 flex flex-wrap items-center gap-2 text-[14px] text-neutral-600">
                  <KindTag kind={t.kind} />
                  <span>{fmtDur(t.mins)}</span>
                  {t.sub && <span>· {t.sub}</span>}
                </div>
              </div>
              <div className="cond w-full text-[15px] sm:w-44 sm:shrink-0">
                {s === "geschaut" && <span className="text-mgreen">✔ geschaut {fmtDate(doc.watched[t.id])}</span>}
                {s === "gestrichen" && <span className="text-neutral-500">✕ gestrichen</span>}
                {s === "offen" && pDate && (
                  <button onClick={() => go("plan", pDate)} className={`underline decoration-2 underline-offset-2 ${late ? "font-extrabold text-mred" : ""}`}>
                    {doc.pins[t.id] ? "📌 " : "📅 "}
                    {fmtDate(pDate)}
                    {late ? " – zu spät!" : ""}
                  </button>
                )}
              </div>
              <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                {s === "offen" && <MoveSelect t={t} pinned={!!doc.pins[t.id]} />}
                {s === "gestrichen" && (
                  <button className="btn !text-sm" onClick={() => update({ k: `skipped.${t.id}`, v: null })}>
                    Zurückholen
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!list.length && <div className="p-5 font-semibold text-neutral-500">Nichts in dieser Liste.</div>}
      </div>
    </div>
  );
}
