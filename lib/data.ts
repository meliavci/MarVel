// Alle Laufzeiten OHNE Abspann (Post-Credit-Szenen zählen mit), ca.-Werte in Minuten.
export type Kind = "core" | "bonus" | "opt";

export interface Title {
  id: string;
  title: string;
  short: string;
  mins: number;
  kind: Kind;
  sub?: string;
}

export const TITLES: Title[] = [
  { id: "falcon", title: "The Falcon & The Winter Soldier – Folge 3–6", short: "Falcon 3–6", mins: 198, kind: "core", sub: "4 Folgen" },
  { id: "thor4", title: "Thor: Love and Thunder", short: "Thor 4", mins: 112, kind: "core" },
  { id: "hs", title: "Guardians of the Galaxy: Holiday Special", short: "GotG Holiday", mins: 41, kind: "core" },
  { id: "aman3", title: "Ant-Man and the Wasp: Quantumania", short: "Ant-Man 3", mins: 119, kind: "core" },
  { id: "gotg3", title: "Guardians of the Galaxy Vol. 3", short: "GotG 3", mins: 142, kind: "core" },
  { id: "blade1", title: "Blade", short: "Blade", mins: 116, kind: "core" },
  { id: "blade2", title: "Blade II", short: "Blade II", mins: 112, kind: "opt" },
  { id: "blade3", title: "Blade: Trinity", short: "Trinity", mins: 108, kind: "opt" },
  { id: "dd", title: "Daredevil", short: "Daredevil", mins: 98, kind: "bonus" },
  { id: "elektra", title: "Elektra", short: "Elektra", mins: 92, kind: "bonus" },
  { id: "ff1", title: "Fantastic Four (2005)", short: "Fantastic Four", mins: 101, kind: "core" },
  { id: "ff2", title: "Fantastic Four: Rise of the Silver Surfer", short: "FF Silver Surfer", mins: 88, kind: "core" },
  { id: "x2", title: "X-Men 2", short: "X-Men 2", mins: 128, kind: "core" },
  { id: "xorig", title: "X-Men Origins: Wolverine", short: "Wolverine Origins", mins: 101, kind: "core" },
  { id: "xfc", title: "X-Men: First Class", short: "First Class", mins: 126, kind: "core" },
  { id: "xls", title: "X-Men: The Last Stand", short: "Last Stand", mins: 100, kind: "core" },
  { id: "xwolv", title: "The Wolverine", short: "The Wolverine", mins: 120, kind: "core" },
  { id: "xdofp", title: "X-Men: Days of Future Past", short: "Days of Future Past", mins: 126, kind: "core" },
  { id: "dp1", title: "Deadpool", short: "Deadpool", mins: 104, kind: "core" },
  { id: "logan", title: "Logan", short: "Logan", mins: 132, kind: "core" },
  { id: "dp2", title: "Deadpool 2", short: "Deadpool 2", mins: 112, kind: "core" },
  { id: "wv1", title: "WandaVision – Folge 1–4", short: "WandaVision 1–4", mins: 120, kind: "core", sub: "4 Folgen" },
  { id: "wv2", title: "WandaVision – Folge 5–7", short: "WandaVision 5–7", mins: 101, kind: "core", sub: "3 Folgen" },
  { id: "wv3", title: "WandaVision – Folge 8–9", short: "WandaVision 8–9", mins: 88, kind: "core", sub: "2 Folgen" },
  { id: "dsmm", title: "Doctor Strange in the Multiverse of Madness", short: "Doctor Strange 2", mins: 120, kind: "core" },
  { id: "vq1", title: "VisionQuest – Folge 1–3", short: "VisionQuest 1–3", mins: 132, kind: "core", sub: "3 Folgen" },
  { id: "vq2", title: "VisionQuest – Folge 4–6", short: "VisionQuest 4–6", mins: 132, kind: "core", sub: "3 Folgen" },
  { id: "vq3", title: "VisionQuest – Folge 7–8", short: "VisionQuest 7–8", mins: 118, kind: "core", sub: "2 Folgen" },
  { id: "wf", title: "Black Panther: Wakanda Forever", short: "Wakanda Forever", mins: 153, kind: "core" },
  { id: "marvels", title: "The Marvels", short: "The Marvels", mins: 100, kind: "core" },
  { id: "loki1", title: "Loki Staffel 2 – Folge 1–2", short: "Loki 1–2", mins: 83, kind: "core", sub: "2 Folgen" },
  { id: "loki2", title: "Loki Staffel 2 – Folge 3–4", short: "Loki 3–4", mins: 93, kind: "core", sub: "2 Folgen" },
  { id: "loki3", title: "Loki Staffel 2 – Folge 5–6", short: "Loki 5–6", mins: 92, kind: "core", sub: "2 Folgen" },
  { id: "dpw", title: "Deadpool & Wolverine", short: "DP & Wolverine", mins: 122, kind: "core" },
  { id: "cap4", title: "Captain America: Brave New World", short: "Cap: BNW", mins: 112, kind: "core" },
  { id: "tb", title: "Thunderbolts*", short: "Thunderbolts*", mins: 121, kind: "core" },
  { id: "punisher", title: "The Punisher: One Last Kill", short: "Punisher", mins: 43, kind: "opt" },
  { id: "ffsteps", title: "Fantastic Four: First Steps", short: "FF: First Steps", mins: 109, kind: "core" },
];

export const TITLE_BY_ID: Record<string, Title> = Object.fromEntries(TITLES.map((t) => [t.id, t]));

export const KIND_LABEL: Record<Kind, string> = { core: "Kern", bonus: "Bonus", opt: "Optional" };

export const START = "2026-11-20";
export const DOOMSDAY = "2026-12-23";
export const DOOMSDAY_MINS = 165;

// ---------- Zeitslots ----------
export type Slot = { s: string; e: string } | "off";

export interface Preset {
  key: string;
  label: string;
  slot: Slot;
}

export const PRESETS: Preset[] = [
  { key: "off", label: "Keine Zeit", slot: "off" },
  { key: "tag", label: "Tagsüber · 15–18 Uhr", slot: { s: "15:00", e: "18:00" } },
  { key: "kurz", label: "Kurz · 21:30–00:00", slot: { s: "21:30", e: "00:00" } },
  { key: "spaet", label: "Spät · 23:00–02:00", slot: { s: "23:00", e: "02:00" } },
  { key: "lang", label: "Lang · 21:30–02:00", slot: { s: "21:30", e: "02:00" } },
  { key: "frueh", label: "Früh · 20:00–01:00", slot: { s: "20:00", e: "01:00" } },
  { key: "max", label: "Ganzer Tag · 15:00–02:00", slot: { s: "15:00", e: "02:00" } },
];

/** Bekannte Termine & Sonderfälle (Standard, solange ihr nichts anderes auswählt) */
export const DEFAULT_OVERRIDES: Record<string, { slot: Slot; label: string }> = {
  "2026-11-21": { slot: { s: "15:00", e: "18:00" }, label: "Nur tagsüber" },
  "2026-11-23": { slot: "off", label: "Justi hat keine Zeit" },
  "2026-12-01": { slot: "off", label: "Hertha – Bayern" },
  "2026-12-02": { slot: { s: "20:30", e: "01:00" }, label: "München" },
  "2026-12-03": { slot: { s: "20:30", e: "01:00" }, label: "München" },
  "2026-12-04": { slot: { s: "20:30", e: "01:00" }, label: "München" },
  "2026-12-05": { slot: "off", label: "Wird schwierig" },
  "2026-12-06": { slot: "off", label: "Keine Zeit" },
  "2026-12-18": { slot: { s: "20:00", e: "01:00" }, label: "Ab jetzt frei" },
  "2026-12-19": { slot: { s: "20:00", e: "02:00" }, label: "Frei" },
  "2026-12-20": { slot: { s: "20:00", e: "01:00" }, label: "Frei" },
  "2026-12-21": { slot: { s: "20:00", e: "01:00" }, label: "Frei" },
  "2026-12-22": { slot: "off", label: "Keine Zeit" },
};
