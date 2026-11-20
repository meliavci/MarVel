"use client";

import { START, TITLES } from "@/lib/data";
import { lastMarathonDay } from "@/lib/planner";
import { settingsOf } from "@/lib/state";
import { dayNum, fmtDate, fmtDur, range, weekday } from "@/lib/time";
import { useM } from "../ctx";
import { Gauge, statusOf } from "../ui";

function Tile({ label, value, sub, tone = "white" }: { label: string; value: string; sub?: string; tone?: "white" | "yellow" | "red" | "green" }) {
  const bg = { white: "#fff", yellow: "var(--color-myellow)", red: "var(--color-mred)", green: "var(--color-mgreen)" }[tone];
  return (
    <div className="panel-sm p-3" style={{ background: bg, color: tone === "red" || tone === "green" ? "#fff" : undefined }}>
      <div className="label">{label}</div>
      <div className="comic text-[32px] leading-none">{value}</div>
      {sub && <div className="cond mt-1 text-[13.5px] opacity-80">{sub}</div>}
    </div>
  );
}

function DailyChart() {
  const { plan, today } = useM();
  const days = range(START, lastMarathonDay);
  const maxCap = Math.max(300, ...days.map((d) => Math.max(plan.byDate[d]?.cap ?? 0, plan.byDate[d]?.used ?? 0)));
  const W = 16;
  const H = 150;
  const y = (m: number) => H - (m / maxCap) * H;
  return (
    <div className="panel overflow-x-auto p-4">
      <div className="mb-2 flex flex-wrap items-center gap-4 text-[13px] font-semibold">
        <span className="label !text-[14px]">Minuten pro Tag</span>
        <span className="flex items-center gap-1">
          <i className="inline-block h-3 w-3 border-2 border-ink bg-white" /> Zeitslot
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block h-3 w-3 border-2 border-ink bg-mgreen" /> geschaut
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block h-3 w-3 border-2 border-ink bg-mred" /> geplant
        </span>
      </div>
      <svg viewBox={`0 0 ${days.length * W + 4} ${H + 26}`} className="min-w-[560px] w-full" role="img" aria-label="Minuten pro Tag">
        {[60, 120, 180, 240, 300].filter((m) => m <= maxCap).map((m) => (
          <g key={m}>
            <line x1="0" x2={days.length * W} y1={y(m)} y2={y(m)} stroke="#000" strokeOpacity=".12" strokeDasharray="3 3" />
            <text x={days.length * W + 2} y={y(m) + 3} fontSize="7" fontFamily="Barlow Condensed" fill="#555">
              {m / 60}h
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const day = plan.byDate[d];
          const cap = day?.cap ?? 0;
          const w = day?.items.filter((x) => x.status === "watched").reduce((s, x) => s + x.t.mins, 0) ?? 0;
          const p = day?.items.filter((x) => x.status === "planned").reduce((s, x) => s + x.t.mins, 0) ?? 0;
          const x = i * W + 2;
          return (
            <g key={d}>
              {cap > 0 && <rect x={x} y={y(cap)} width={W - 4} height={H - y(cap)} fill="#fff" stroke="#111" strokeWidth="1.5" />}
              {w > 0 && <rect x={x + 2} y={y(w)} width={W - 8} height={H - y(w)} fill="#1f9d55" />}
              {p > 0 && <rect x={x + 2} y={y(w + p)} width={W - 8} height={H - y(p)} fill={day?.over ? "#7a0a0f" : "#ec1d24"} />}
              {cap === 0 && <text x={x + (W - 4) / 2} y={H - 3} fontSize="9" textAnchor="middle" fill="#888">✕</text>}
              <text x={x + (W - 4) / 2} y={H + 11} fontSize="7.5" textAnchor="middle" fontFamily="Barlow Condensed" fontWeight={d === today ? 800 : 600} fill={d === today ? "#ec1d24" : "#333"}>
                {dayNum(d)}
              </text>
              {weekday(d) === 1 && <text x={x + (W - 4) / 2} y={H + 21} fontSize="6.5" textAnchor="middle" fontFamily="Barlow Condensed" fill="#777">Mo</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ForecastView() {
  const { forecast: f, plan, doc, update } = useM();
  const st = statusOf(f.probability);
  const s = settingsOf(doc);
  const setS = (k: string, v: number) => update({ k: `settings.${k}`, v });
  const dropKinds = (kinds: string[]) =>
    update(TITLES.filter((t) => kinds.includes(t.kind) && !doc.watched[t.id]).flatMap((t) => [{ k: `skipped.${t.id}`, v: true }, { k: `pins.${t.id}`, v: null }]));
  const watchedMins = TITLES.filter((t) => doc.watched[t.id]).reduce((a, t) => a + t.mins, 0);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="panel flex flex-col items-center p-5 text-center">
          <h2 className="cap mb-2 self-start">Prognose</h2>
          <Gauge p={f.probability} size={280} />
          <div className="comic text-4xl" style={{ color: st.color }}>
            {st.label}
          </div>
          <p className="cond mt-1 text-[16px]">
            Wahrscheinlichkeit, dass ihr alles bis zum 22.12. schafft. {st.text}
          </p>
        </div>
        <div className="grid grid-cols-2 content-start gap-4 sm:grid-cols-3">
          <Tile label="Noch zu schauen" value={fmtDur(f.need)} sub={`${plan.remaining.length} Titel inkl. Pausen`} />
          <Tile label="Eure Zeit bis 22.12." value={fmtDur(f.capacity)} sub={`${f.daysLeft} Abende mit Slot`} />
          <Tile
            label="Puffer"
            value={`${f.buffer < 0 ? "−" : ""}${fmtDur(Math.abs(f.buffer))}`}
            sub={`bei ${Math.round(s.reliability * 100)} % Ausnutzung`}
            tone={f.buffer < 0 ? "red" : f.buffer < 180 ? "yellow" : "green"}
          />
          <Tile label="Nötig pro Abend" value={fmtDur(f.perEvening)} sub="im Schnitt" />
          <Tile
            label="Laut Plan fertig"
            value={plan.late.length ? "Zu spät" : plan.finish ? fmtDate(plan.finish) : "Fertig!"}
            sub={plan.late.length ? `${plan.late.length} Titel landen nach Doomsday` : "danach: Puffer bis Doomsday"}
            tone={plan.late.length ? "red" : "white"}
          />
          <Tile
            label="Euer Tempo bisher"
            value={f.pace === null ? "–" : `${Math.round(f.pace * 100)} %`}
            sub={f.pace === null ? "ab morgen messbar" : `${fmtDur(f.pastWatched)} von ${fmtDur(f.pastCap)} Slot-Zeit genutzt`}
            tone={f.pace === null ? "white" : f.pace >= s.reliability ? "green" : "yellow"}
          />
        </div>
      </section>

      <section>
        <h3 className="comic mb-3 text-[28px]">Was wäre, wenn …</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {f.scenarios.map((sc) => {
            const sst = statusOf(sc.probability);
            const active = sc.drop.length > 0 && TITLES.filter((t) => sc.drop.includes(t.kind) && !doc.watched[t.id]).every((t) => doc.skipped[t.id]);
            return (
              <div key={sc.label} className="panel-sm flex flex-col gap-2 p-4">
                <div className="label">{sc.label}</div>
                <div className="flex items-end gap-3">
                  <span className="comic text-5xl leading-none" style={{ color: sst.color }}>
                    {Math.round(sc.probability * 100)}%
                  </span>
                  <span className="cond pb-1 text-neutral-600">{fmtDur(sc.remainingMins)} offen</span>
                </div>
                <div className="h-4 border-2 border-ink bg-white">
                  <div className="h-full" style={{ width: `${sc.probability * 100}%`, background: sst.color }} />
                </div>
                {sc.drop.length > 0 && (
                  <button className={`btn mt-1 !text-base ${active ? "" : "btn-yellow"}`} disabled={active} onClick={() => dropKinds(sc.drop)}>
                    {active ? "Ist schon gestrichen" : "So machen wir’s"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="comic mb-3 text-[28px]">Tag für Tag</h3>
        <DailyChart />
        <div className="cond mt-2 text-[14px] text-neutral-600">
          Bisher geschaut: {fmtDur(watchedMins)}. Dunkelrote Balken = Abend ist überbucht.
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h3 className="comic mb-4 text-[28px]">Wie realistisch seid ihr?</h3>
          <Slider
            label="Wie viel eines Zeitslots schaut ihr wirklich?"
            hint="Quatschen, Snacks holen, Einschlafen … 100 % = jede Minute Film."
            min={50}
            max={100}
            step={5}
            value={Math.round(s.reliability * 100)}
            fmt={(v) => `${v} %`}
            onChange={(v) => setS("reliability", v / 100)}
          />
          <Slider
            label="Wie oft fällt spontan ein Abend aus?"
            hint="Müde, Besuch, Arbeit, Termine …"
            min={0}
            max={40}
            step={5}
            value={Math.round(s.skipChance * 100)}
            fmt={(v) => `${v} %`}
            onChange={(v) => setS("skipChance", v / 100)}
          />
          <Slider
            label="Pause zwischen zwei Titeln"
            hint="Gilt auch für den Tagesplan."
            min={0}
            max={30}
            step={5}
            value={s.breakMin}
            fmt={(v) => `${v} Min`}
            onChange={(v) => setS("breakMin", v)}
          />
          {f.pace !== null && (
            <button className="btn btn-yellow mt-2 !text-base" onClick={() => setS("reliability", Math.min(1, Math.max(0.5, Math.round(f.pace! * 20) / 20)))}>
              Euer echtes Tempo übernehmen ({Math.round(f.pace * 100)} %)
            </button>
          )}
        </div>
        <div className="panel p-5 text-[15px] leading-relaxed">
          <h3 className="comic mb-3 text-[28px]">So wird gerechnet</h3>
          <p className="mb-2">
            Die App spielt euren restlichen Marathon <b>2.500-mal durch</b>. In jedem Durchlauf fällt jeder Abend mit der eingestellten Chance aus, und an den übrigen schaut ihr mal mehr, mal weniger – im Schnitt so viel, wie oben eingestellt.
          </p>
          <p className="mb-2">
            Die Titel laufen <b>der Reihe nach und am Stück</b>: Ihr fangt einen Film an, wenn noch mindestens gut die Hälfte davon in den Abend passt – und schaut ihn dann zu Ende. Sonst wartet er auf den nächsten Abend.
          </p>
          <p>
            Die Prozentzahl ist der Anteil der Durchläufe, in denen bis zum 22.12. alles geschaut ist. Laufzeiten sind ca.-Werte ohne Abspann.
          </p>
        </div>
      </section>
    </div>
  );
}

function Slider(p: { label: string; hint: string; min: number; max: number; step: number; value: number; fmt: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <label className="mb-5 block">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-bold">{p.label}</span>
        <span className="comic text-2xl">{p.fmt(p.value)}</span>
      </div>
      <input
        type="range"
        min={p.min}
        max={p.max}
        step={p.step}
        value={p.value}
        onChange={(e) => p.onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[#ec1d24]"
      />
      <div className="cond text-[13.5px] text-neutral-600">{p.hint}</div>
    </label>
  );
}
