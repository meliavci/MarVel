"use client";

import { createContext, useContext } from "react";
import type { Forecast } from "@/lib/forecast";
import type { Plan } from "@/lib/planner";
import type { Doc, Op } from "@/lib/state";

export type View = "heute" | "plan" | "kalender" | "titel" | "prognose";

export interface Ctx {
  doc: Doc;
  plan: Plan;
  forecast: Forecast;
  today: string;
  update: (ops: Op | Op[]) => void;
  go: (view: View, date?: string) => void;
}

export const MarathonCtx = createContext<Ctx | null>(null);

export function useM(): Ctx {
  const c = useContext(MarathonCtx);
  if (!c) throw new Error("MarathonCtx fehlt");
  return c;
}
