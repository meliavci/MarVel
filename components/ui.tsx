"use client";

import { useEffect, useRef, useState } from "react";
import { DOOMSDAY, KIND_LABEL, PRESETS, type Kind, type Slot, type Title } from "@/lib/data";
import { lastMarathonDay, slotFor, type PlanItem } from "@/lib/planner";
import { addDays, defaultSlot, fmtDate, fmtDateLong, fmtDur, minToClock, range, slotCap } from "@/lib/time";
import { useM } from "./ctx";

export function KindTag({ kind }: { kind: Kind }) {
  return <span className={`tag tag-${kind}`}>{KIND_LABEL[kind]}</span>;
}

export const slotText = (s: Slot) => (s === "off" ? "Keine Zeit" : `${s.s}–${s.e}`);

export function statusOf(p: number) {
  if (p >= 0.85) return { label: "Läuft!", color: "var(--color-mgreen)", text: "Ihr seid voll im Plan." };
  if (p >= 0.6) return { label: "Machbar", color: "#e0a800", text: "Klappt, wenn nicht zu viel dazwischenkommt." };
  if (p >= 0.3) return { label: "Wird eng", color: "#ef7d00", text: "Streichen oder mehr Zeit einplanen." };
  return { label: "Kritisch", color: "var(--color-mred)", text: "So schafft ihr es nicht bis Doomsday." };
}

/** Zeitslot für einen Tag wählen: Standard, Vorlage oder eigene Uhrzeit */
export function SlotPicker({ date, compact = false }: { date: string; compact?: boolean }) {
  const { doc, update } = useM();
  const cur = slotFor(doc, date);
  const def = defaultSlot(date);
  const matching = PRESETS.find((p) => JSON.stringify(p.slot) === JSON.stringify(cur.slot));
  const [forceCustom, setForceCustom] = useState(false);
  const key = !cur.custom ? "default" : forceCustom || !matching ? "custom" : matching.key;
  const set = (v: Slot | null) => update({ k: `slots.${date}`, v });

  return (
    <div className="flex flex-col gap-2">
      <select
        className="field"
        aria-label="Zeitslot"
        value={key}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "default") {
            setForceCustom(false);
            set(null);
          } else if (v === "custom") {
            setForceCustom(true);
            set(cur.slot === "off" ? { s: "21:30", e: "00:00" } : cur.slot);
          } else {
            setForceCustom(false);
            set(PRESETS.find((p) => p.key === v)!.slot);
          }
        }}
      >
        <option value="default">
          Standard · {slotText(def.slot)}
        </option>
        {PRESETS.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
        <option value="custom">Eigene Uhrzeit …</option>
      </select>
      {key === "custom" && cur.slot !== "off" && (
        <div className={`flex items-center gap-2 ${compact ? "" : "flex-wrap"}`}>
          <input
            type="time"
            className="field !w-auto"
            value={cur.slot.s}
            aria-label="Start"
            onChange={(e) => e.target.value && set({ s: e.target.value, e: (cur.slot as { e: string }).e })}
          />
          <span className="cond">bis</span>
          <input
            type="time"
            className="field !w-auto"
            value={cur.slot.e}
            aria-label="Ende"
            onChange={(e) => e.target.value && set({ s: (cur.slot as { s: string }).s, e: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

/** Titel auf einen anderen Tag legen, zurück in den Auto-Plan geben oder streichen */
export function MoveSelect({ t, pinned, from }: { t: Title; pinned: boolean; from?: string }) {
  const { doc, today, update } = useM();
  const dates = today <= lastMarathonDay ? range(today, lastMarathonDay) : [];
  return (
    <select
      className="field !w-auto !py-1 !text-[13px] cond"
      aria-label={`${t.short} verschieben`}
      value=""
      onChange={(e) => {
        const v = e.target.value;
        if (v === "auto") update({ k: `pins.${t.id}`, v: null });
        else if (v === "skip") update([{ k: `skipped.${t.id}`, v: true }, { k: `pins.${t.id}`, v: null }]);
        else if (v) update({ k: `pins.${t.id}`, v });
      }}
    >
      <option value="">Verschieben …</option>
      {pinned && <option value="auto">↺ Zurück in den Auto-Plan</option>}
      {dates.map((d) => {
        const cap = slotCap(slotFor(doc, d).slot);
        return (
          <option key={d} value={d} disabled={cap === 0 || d === from}>
            {d === today ? "Heute" : d === addDays(today, 1) ? "Morgen" : fmtDateLong(d)}
            {cap === 0 ? " (keine Zeit)" : ""}
          </option>
        );
      })}
      <option value="skip">✕ Ganz streichen</option>
    </select>
  );
}

/** Eine Film-/Folgenzeile mit Haken */
export function TitleLine({ item, date, showMove = true, showTime = true }: { item: PlanItem; date: string; showMove?: boolean; showTime?: boolean }) {
  const { doc, today, update } = useM();
  const { t } = item;
  const checked = !!doc.watched[t.id];
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        className="chk mt-0.5"
        checked={checked}
        aria-label={`${t.title} geschaut`}
        onChange={(e) =>
          update(
            e.target.checked
              ? [
                  { k: `watched.${t.id}`, v: date <= today ? date : today },
                  { k: `pins.${t.id}`, v: null },
                ]
              : { k: `watched.${t.id}`, v: null },
          )
        }
      />
      <div className="min-w-0 flex-1">
        <div className={`text-[17px] font-bold leading-tight break-words ${checked ? "line-through decoration-2 text-neutral-500" : ""}`}>{t.title}</div>
        <div className="cond mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14.5px] text-neutral-600">
          <KindTag kind={t.kind} />
          <span>{fmtDur(t.mins)}</span>
          {t.sub && <span>· {t.sub}</span>}
          {showTime && item.start !== undefined && item.status === "planned" && (
            <span className="text-ink">
              · {minToClock(item.start)}–{minToClock(item.end!)}
            </span>
          )}
          {item.pinned && <span className="tag bg-white">📌 fest</span>}
          {showMove && item.status === "planned" && <MoveSelect t={t} pinned={item.pinned} from={date} />}
        </div>
      </div>
    </div>
  );
}

/** Notizfeld, speichert nach kurzer Tipp-Pause */
export function NoteField({ date }: { date: string }) {
  const { doc, update } = useM();
  const remote = doc.notes[date] ?? "";
  const [val, setVal] = useState(remote);
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!focused.current) setVal(remote);
  }, [remote]);
  const save = (v: string) => update({ k: `notes.${date}`, v: v.trim() ? v.slice(0, 500) : null });
  return (
    <textarea
      className="field min-h-[58px] resize-y"
      rows={2}
      maxLength={500}
      aria-label="Notiz"
      placeholder="Notiz …"
      value={val}
      onFocus={() => (focused.current = true)}
      onBlur={() => {
        focused.current = false;
        if (timer.current) clearTimeout(timer.current);
        if (val !== remote) save(val);
      }}
      onChange={(e) => {
        setVal(e.target.value);
        if (timer.current) clearTimeout(timer.current);
        const v = e.target.value;
        timer.current = setTimeout(() => save(v), 700);
      }}
    />
  );
}

/** Halbkreis-Anzeige für die Wahrscheinlichkeit */
export function Gauge({ p, size = 220 }: { p: number; size?: number }) {
  const st = statusOf(p);
  const r = 80;
  const len = Math.PI * r;
  return (
    <svg viewBox="0 0 200 118" width={size} role="img" aria-label={`${Math.round(p * 100)} Prozent`}>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#111" strokeWidth="26" strokeLinecap="butt" />
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#fff" strokeWidth="18" />
      <path
        d="M20 100 A80 80 0 0 1 180 100"
        fill="none"
        stroke={st.color}
        strokeWidth="18"
        strokeDasharray={`${len * p} ${len}`}
        style={{ transition: "stroke-dasharray .6s" }}
      />
      <text x="100" y="96" textAnchor="middle" fontFamily="Bangers, Impact" fontSize="44" fill="#111" letterSpacing="1">
        {Math.round(p * 100)}%
      </text>
    </svg>
  );
}

export function daysUntilDoom(today: string) {
  const ms = Date.UTC(+DOOMSDAY.slice(0, 4), +DOOMSDAY.slice(5, 7) - 1, +DOOMSDAY.slice(8, 10)) - Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  return Math.round(ms / 86400000);
}

export { fmtDate };
