import type { Slot } from "./data";

/** Gemeinsamer Zustand. Jeder Eintrag ist ein eigenes Feld, damit gleichzeitige Änderungen sich nicht überschreiben. */
export interface Doc {
  watched: Record<string, string>; // titelId -> Datum, an dem geschaut
  skipped: Record<string, boolean>; // titelId -> gestrichen
  pins: Record<string, string>; // titelId -> fest auf Datum gelegt
  slots: Record<string, Slot>; // Datum -> gewählter Zeitslot
  notes: Record<string, string>; // Datum -> Notiz
  settings: Record<string, number>;
}

export type Section = keyof Doc;
export const SECTIONS: Section[] = ["watched", "skipped", "pins", "slots", "notes", "settings"];

export interface Op {
  k: string; // "section.key"
  v: unknown; // null = löschen
}

export const emptyDoc = (): Doc => ({ watched: {}, skipped: {}, pins: {}, slots: {}, notes: {}, settings: {} });

export const KEY_RE = /^(watched|skipped|pins|slots|notes|settings)\.[A-Za-z0-9_-]{1,40}$/;

export function applyOps(doc: Doc, ops: Op[]): Doc {
  const next: Doc = {
    watched: { ...doc.watched },
    skipped: { ...doc.skipped },
    pins: { ...doc.pins },
    slots: { ...doc.slots },
    notes: { ...doc.notes },
    settings: { ...doc.settings },
  };
  for (const op of ops) {
    if (!KEY_RE.test(op.k)) continue;
    const i = op.k.indexOf(".");
    const sec = op.k.slice(0, i) as Section;
    const key = op.k.slice(i + 1);
    const bucket = next[sec] as Record<string, unknown>;
    if (op.v === null || op.v === undefined) delete bucket[key];
    else bucket[key] = op.v;
  }
  return next;
}

export function docFromFields(fields: Record<string, string>): Doc {
  const ops: Op[] = [];
  for (const [k, raw] of Object.entries(fields)) {
    if (!KEY_RE.test(k)) continue;
    try {
      ops.push({ k, v: JSON.parse(raw) });
    } catch {
      /* kaputtes Feld ignorieren */
    }
  }
  return applyOps(emptyDoc(), ops);
}

export interface Settings {
  reliability: number; // Anteil eines Slots, den ihr wirklich schaut
  skipChance: number; // Chance, dass ein Abend spontan ausfällt
  breakMin: number; // Pause zwischen zwei Titeln
}
export const DEFAULT_SETTINGS: Settings = { reliability: 0.9, skipChance: 0.1, breakMin: 10 };
export const settingsOf = (doc: Doc): Settings => ({ ...DEFAULT_SETTINGS, ...doc.settings });
