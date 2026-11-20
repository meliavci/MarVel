# Marvel Marathon – Road to Doomsday

Melis & Justis Marathon-Planer bis **Avengers: Doomsday (23.12.2026)**.
Next.js 16 · React 19 · TypeScript · Tailwind 4 · Sync über Upstash Redis.

## Was die App kann

- **Heute**: Programm für heute Abend mit Startzeiten, Countdown und Prognose auf einen Blick
- **Plan**: alle Tage nach Wochen. Pro Tag einen **Zeitslot** wählen (Vorlage oder eigene Uhrzeit), abhaken, Notiz
- **Kalender**: Monatsübersicht, ein Tipp zeigt den Tag darunter
- **Titel**: alle 38 Titel mit Status, Filter, fest verschieben, streichen und zurückholen
- **Prognose**: Wahrscheinlichkeit, dass ihr es bis zum 22.12. schafft (2.500 simulierte Verläufe), Puffer, nötige Zeit pro Abend, euer bisheriges Tempo, „Was wäre, wenn…“ ohne Optionales/Bonus, Balkendiagramm pro Tag. Regler für Ausfall-Chance und Ausnutzung

**Auto-Plan:** Offene Titel werden der Reihe nach auf eure Slots verteilt. Was ihr nicht abhakt, rutscht am nächsten Tag automatisch weiter. Mit „Verschieben“ legt ihr einen Titel fest (📌) auf einen Tag, mit „Zurück in den Auto-Plan“ wird er wieder frei verteilt.

## Online stellen (GitHub + Vercel)

1. **GitHub:** Neues Repository anlegen (gern privat) und den Inhalt dieses Ordners hochladen.
   Mit Git:
   ```bash
   git init && git add . && git commit -m "Marvel Marathon"
   git branch -M main
   git remote add origin https://github.com/DEIN-NAME/marvel-marathon.git
   git push -u origin main
   ```
2. **Vercel:** *Add New → Project* → Repository importieren → *Deploy*. Next.js wird automatisch erkannt, sonst ist nichts einzustellen.
3. **Gemeinsamer Speicher (wichtig, sonst speichert jedes Handy nur für sich):**
   Im Vercel-Projekt → Tab **Storage** → *Create Database* → **Upstash for Redis** (Free-Plan reicht) → mit dem Projekt verbinden.
   Vercel setzt dabei `KV_REST_API_URL` und `KV_REST_API_TOKEN` automatisch (`UPSTASH_REDIS_REST_URL`/`_TOKEN` funktionieren auch).
   Danach unter *Deployments* einmal **Redeploy**.
   Oben in der App steht dann grün **„● Gemeinsam synchron“**.
4. **Optional, PIN-Schutz:** *Settings → Environment Variables* → `APP_PIN` = z. B. `2312` → Redeploy. Beim ersten Öffnen fragt die App einmal nach der PIN und merkt sie sich auf dem Gerät.

Tipp: Auf dem Handy über „Zum Home-Bildschirm“ wie eine App ablegen.

## Lokal starten

```bash
npm install
npm run dev        # http://localhost:3000
```
Ohne `.env.local` läuft alles nur im Browser („Nur auf diesem Gerät“). Für Sync die Werte aus `.env.example` in `.env.local` eintragen.
Zum Testen eines anderen Datums: `http://localhost:3000/?heute=2026-12-02`

## Anpassen

- **Titel, Laufzeiten, Reihenfolge:** `lib/data.ts` → `TITLES` (Minuten ohne Abspann)
- **Feste Termine/Standard-Slots:** `lib/data.ts` → `DEFAULT_OVERRIDES`, Wochentags-Standard in `lib/time.ts` → `defaultSlot`
- **Slot-Vorlagen:** `lib/data.ts` → `PRESETS`
- **Planer/Prognose:** `lib/planner.ts`, `lib/forecast.ts`

Eure Häkchen hängen an den Titel-IDs (`id`). Ändert also die Laufzeiten ruhig, aber nicht die IDs.

## Aufbau

```
app/api/state/route.ts   GET/POST für den gemeinsamen Zustand (Redis-Hash, ein Feld pro Eintrag)
lib/useMarathon.ts       Sync im Browser (sofort lokal, alle 4 s abgleichen, offline nachholen)
lib/planner.ts           Auto-Plan
lib/forecast.ts          Monte-Carlo-Prognose
components/              Ansichten im Comic-Design
```
