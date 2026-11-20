import { NextResponse } from "next/server";
import { docFromFields, KEY_RE, type Op } from "@/lib/state";

export const dynamic = "force-dynamic";

// Vercel setzt KV_REST_API_* automatisch, wenn "Upstash for Redis" verbunden ist.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const KEY = process.env.MARATHON_KEY || "marvel-marathon:v1";
const PIN = process.env.APP_PIN || "";

type Cmd = (string | number)[];

async function redis(cmds: Cmd[]): Promise<unknown[]> {
  const res = await fetch(`${URL_.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result;
  });
}

function denied(req: Request) {
  return PIN !== "" && req.headers.get("x-app-pin") !== PIN;
}

export async function GET(req: Request) {
  if (!URL_ || !TOKEN) return NextResponse.json({ mode: "local", pinRequired: false });
  if (denied(req)) return NextResponse.json({ error: "pin" }, { status: 401 });
  try {
    const [flat] = (await redis([["HGETALL", KEY]])) as [string[] | Record<string, string> | null];
    const fields: Record<string, string> = {};
    if (Array.isArray(flat)) for (let i = 0; i < flat.length; i += 2) fields[flat[i]] = flat[i + 1];
    else if (flat) Object.assign(fields, flat);
    const rev = Number(fields._rev ?? 0);
    return NextResponse.json({ mode: "cloud", rev, doc: docFromFields(fields) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

export async function POST(req: Request) {
  if (!URL_ || !TOKEN) return NextResponse.json({ mode: "local" }, { status: 409 });
  if (denied(req)) return NextResponse.json({ error: "pin" }, { status: 401 });
  let body: { ops?: Op[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const ops = Array.isArray(body.ops) ? body.ops.slice(0, 200) : [];
  const cmds: Cmd[] = [];
  for (const op of ops) {
    if (typeof op?.k !== "string" || !KEY_RE.test(op.k)) continue;
    if (op.v === null || op.v === undefined) cmds.push(["HDEL", KEY, op.k]);
    else {
      const raw = JSON.stringify(op.v);
      if (raw.length > 2000) continue;
      cmds.push(["HSET", KEY, op.k, raw]);
    }
  }
  if (!cmds.length) return NextResponse.json({ ok: true });
  cmds.push(["HINCRBY", KEY, "_rev", 1]);
  try {
    const res = await redis(cmds);
    return NextResponse.json({ ok: true, rev: Number(res[res.length - 1]) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
