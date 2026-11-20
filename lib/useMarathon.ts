"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyOps, emptyDoc, type Doc, type Op } from "./state";
import { berlinNow } from "./time";

export type Mode = "loading" | "cloud" | "local" | "locked" | "offline";

const LOCAL_KEY = "marvel-marathon:local";
const PIN_KEY = "marvel-marathon:pin";

function readLocal(): Doc {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? { ...emptyDoc(), ...JSON.parse(raw) } : emptyDoc();
  } catch {
    return emptyDoc();
  }
}

function useToday() {
  const [now, setNow] = useState(() => berlinNow());
  useEffect(() => {
    const id = setInterval(() => setNow(berlinNow()), 60_000);
    return () => clearInterval(id);
  }, []);
  // Zum Testen: ?heute=2026-11-25
  const [override, setOverride] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("heute");
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) setOverride(p);
  }, []);
  return override ?? now.today;
}

export function useMarathon() {
  const [doc, setDoc] = useState<Doc>(emptyDoc);
  const [mode, setModeState] = useState<Mode>("loading");
  const modeRef = useRef<Mode>("loading");
  const serverDoc = useRef<Doc>(emptyDoc());
  const pending = useRef<Op[]>([]);
  const inflight = useRef<Op[]>([]);
  const rev = useRef<number>(-1);
  const pin = useRef<string>("");
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = useToday();

  const setMode = (m: Mode) => {
    modeRef.current = m;
    setModeState(m);
  };
  const recompute = () => setDoc(applyOps(serverDoc.current, [...inflight.current, ...pending.current]));
  const headers = (): HeadersInit => ({
    "Content-Type": "application/json",
    ...(pin.current ? { "x-app-pin": pin.current } : {}),
  });

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/state", { headers: headers(), cache: "no-store" });
      if (r.status === 401) return setMode("locked");
      const j = await r.json();
      if (j.mode === "local") {
        if (modeRef.current !== "local") {
          serverDoc.current = readLocal();
          recompute();
          setMode("local");
        }
        return;
      }
      if (j.mode === "cloud") {
        if (j.rev !== rev.current) {
          rev.current = j.rev;
          serverDoc.current = j.doc;
          recompute();
        }
        if (modeRef.current !== "cloud") setMode("cloud");
        if (pending.current.length) scheduleFlush();
        return;
      }
      throw new Error(j.error ?? "unbekannt");
    } catch {
      if (modeRef.current === "loading") {
        // Ohne Server (z. B. lokal geöffnet): auf dem Gerät speichern
        serverDoc.current = readLocal();
        recompute();
        setMode("offline");
      } else if (modeRef.current === "cloud") setMode("offline");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flush = useCallback(async () => {
    if (modeRef.current !== "cloud" || !pending.current.length || inflight.current.length) return;
    inflight.current = pending.current;
    pending.current = [];
    try {
      const r = await fetch("/api/state", { method: "POST", headers: headers(), body: JSON.stringify({ ops: inflight.current }) });
      if (r.status === 401) throw Object.assign(new Error("pin"), { locked: true });
      if (!r.ok) throw new Error(String(r.status));
      rev.current = -1; // neu laden erzwingen
      await load();
      inflight.current = [];
      recompute();
      if (pending.current.length) scheduleFlush();
    } catch (e) {
      pending.current = [...inflight.current, ...pending.current];
      inflight.current = [];
      if ((e as { locked?: boolean }).locked) setMode("locked");
      else setMode("offline");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const scheduleFlush = () => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => void flush(), 350);
  };

  const update = useCallback((ops: Op | Op[]) => {
    const list = Array.isArray(ops) ? ops : [ops];
    if (modeRef.current === "local" || (modeRef.current === "offline" && rev.current < 0)) {
      serverDoc.current = applyOps(serverDoc.current, list);
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(serverDoc.current));
      } catch {
        /* egal */
      }
      recompute();
      return;
    }
    pending.current = [...pending.current, ...list];
    recompute();
    scheduleFlush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlock = useCallback(
    (p: string) => {
      pin.current = p.trim();
      try {
        localStorage.setItem(PIN_KEY, pin.current);
      } catch {
        /* egal */
      }
      modeRef.current = "loading";
      void load();
    },
    [load],
  );

  useEffect(() => {
    try {
      pin.current = localStorage.getItem(PIN_KEY) ?? "";
    } catch {
      /* egal */
    }
    void load();
    const tick = () => {
      if (document.visibilityState === "visible" && (modeRef.current === "cloud" || modeRef.current === "offline")) void load();
    };
    const id = setInterval(tick, 4000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [load]);

  return { doc, mode, update, unlock, today };
}
