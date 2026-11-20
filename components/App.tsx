"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TITLES } from "@/lib/data";
import { buildForecast } from "@/lib/forecast";
import { buildPlan } from "@/lib/planner";
import { fmtDur } from "@/lib/time";
import { useMarathon, type Mode } from "@/lib/useMarathon";
import { MarathonCtx, type View } from "./ctx";
import { daysUntilDoom } from "./ui";
import CalendarView from "./views/CalendarView";
import ForecastView from "./views/ForecastView";
import PlanView from "./views/PlanView";
import TitlesView from "./views/TitlesView";
import TodayView from "./views/TodayView";

const TABS: { id: View; label: string; icon: string }[] = [
  { id: "heute", label: "Heute", icon: "★" },
  { id: "plan", label: "Plan", icon: "☰" },
  { id: "kalender", label: "Kalender", icon: "▦" },
  { id: "titel", label: "Titel", icon: "▶" },
  { id: "prognose", label: "Prognose", icon: "%" },
];

function SyncChip({ mode }: { mode: Mode }) {
  const m: Record<Mode, [string, string, string]> = {
    loading: ["#fff", "#111", "Lädt …"],
    cloud: ["var(--color-mgreen)", "#fff", "● Gemeinsam synchron"],
    local: ["var(--color-myellow)", "#111", "Nur auf diesem Gerät"],
    offline: ["#fff", "var(--color-mred)", "Offline – wird nachgeholt"],
    locked: ["#111", "#fff", "Gesperrt"],
  };
  const [bg, fg, txt] = m[mode];
  return (
    <span
      className="label border-2 border-ink px-2 py-0.5 !text-[11.5px] whitespace-nowrap"
      style={{ background: bg, color: fg }}
      title={mode === "local" ? "Keine Datenbank verbunden – siehe README (Upstash Redis in Vercel)." : undefined}
    >
      {txt}
    </span>
  );
}

function PinScreen({ onSubmit }: { onSubmit: (p: string) => void }) {
  const [pin, setPin] = useState("");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form
        className="panel w-full max-w-sm p-6"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(pin);
        }}
      >
        <div className="comic mb-1 text-4xl">Halt, Agent!</div>
        <p className="cond mb-4 text-[16px]">Dieser Marathon ist S.H.I.E.L.D.-geschützt. Bitte PIN eingeben.</p>
        <input autoFocus className="field mb-4 !text-xl tracking-[0.3em]" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} aria-label="PIN" />
        <button className="btn btn-red w-full !text-xl" type="submit">
          Rein da!
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const { doc, mode, update, unlock, today } = useMarathon();
  const [view, setView] = useState<View>("heute");
  const plan = useMemo(() => buildPlan(doc, today), [doc, today]);
  const forecast = useMemo(() => buildForecast(doc, today), [doc, today]);

  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#", "") as View;
      if (TABS.some((t) => t.id === h)) setView(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const go = useCallback((v: View, date?: string) => {
    setView(v);
    history.replaceState(null, "", `#${v}`);
    if (date) setTimeout(() => document.getElementById(`day-${date}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const watched = TITLES.filter((t) => doc.watched[t.id]);
  const active = TITLES.filter((t) => !doc.skipped[t.id] || doc.watched[t.id]);
  const total = active.reduce((s, t) => s + t.mins, 0);
  const done = watched.reduce((s, t) => s + t.mins, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const left = daysUntilDoom(today);

  return (
    <MarathonCtx.Provider value={{ doc, plan, forecast, today, update, go }}>
      {/* Header */}
      <header className="halftone-red relative overflow-hidden border-b-[5px] border-ink">
        <div className="rays pointer-events-none absolute -inset-1/2" />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-4 py-5 sm:px-6 sm:py-7">
          <div>
            <div className="inline-flex border-[3px] border-white shadow-[5px_5px_0_#111]">
              <span className="bg-mred px-2.5 pb-0.5 pt-1 font-logo text-[30px] leading-none tracking-tight text-white sm:text-[38px]">MARVEL</span>
              <span className="flex items-center bg-white px-2.5 font-logo text-base tracking-wide sm:text-xl">MARATHON</span>
            </div>
            <h1 className="stroke-title mt-3 text-[48px] sm:text-[74px]">Road to Doomsday</h1>
            <div className="cond mt-2 inline-block bg-ink px-3 py-1 text-[13px] tracking-[0.2em] text-white uppercase sm:text-[15px]">Meli &amp; Justi · 20.11. – 23.12.2026</div>
          </div>
          <div className="flex gap-3">
            <div className="panel-sm -rotate-2 px-4 py-2">
              <div className="comic text-[34px] leading-none">
                {watched.length}/{active.length}
              </div>
              <div className="label !text-[11px]">Titel geschafft</div>
            </div>
            <div className="panel-sm rotate-1 bg-myellow px-4 py-2" style={{ background: "var(--color-myellow)" }}>
              <div className="comic text-[34px] leading-none">{left > 0 ? left : "!"}</div>
              <div className="label !text-[11px]">Tage bis Doom</div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs + Fortschritt */}
      <nav className="sticky top-0 z-40 border-b-[3px] border-ink bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-5 items-center gap-1.5 px-3 py-2 sm:flex sm:gap-2 sm:px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              aria-current={view === t.id ? "page" : undefined}
              className={`comic min-w-0 shrink-0 border-[2.5px] border-ink px-0.5 pb-0.5 pt-1 text-[14px] transition sm:border-[3px] sm:px-3 sm:text-xl ${
                view === t.id ? "bg-mred text-white shadow-[3px_3px_0_#111]" : "bg-white hover:bg-[#ffe1e2]"
              }`}
            >
              <span className="mr-1 hidden sm:inline">{t.icon}</span>
              {t.label}
            </button>
          ))}
          <div className="ml-auto hidden items-center gap-3 pl-3 md:!flex">
            <SyncChip mode={mode} />
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 pb-2 sm:px-6">
          <div className="h-4 flex-1 overflow-hidden border-[2.5px] border-ink bg-white">
            <div
              className="h-full border-r-[2.5px] border-ink transition-all duration-500"
              style={{ width: `${pct}%`, background: "repeating-linear-gradient(-45deg,#ec1d24 0 10px,#b0121a 10px 20px)", borderRightWidth: pct ? 2.5 : 0 }}
            />
          </div>
          <span className="comic text-xl">{pct}%</span>
          <span className="cond hidden text-[14px] text-neutral-600 sm:inline">{fmtDur(done)} geschaut</span>
          <span className="md:hidden">
            <SyncChip mode={mode} />
          </span>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-3 pb-20 pt-7 sm:px-6">
        {view === "heute" && <TodayView />}
        {view === "plan" && <PlanView />}
        {view === "kalender" && <CalendarView />}
        {view === "titel" && <TitlesView />}
        {view === "prognose" && <ForecastView />}
      </main>

      <footer className="cond mx-auto max-w-6xl px-6 pb-10 text-center text-[13px] text-neutral-600">
        Laufzeiten ca.-Werte ohne Abspann · Excelsior!
      </footer>

      {mode === "locked" && <PinScreen onSubmit={unlock} />}
    </MarathonCtx.Provider>
  );
}
