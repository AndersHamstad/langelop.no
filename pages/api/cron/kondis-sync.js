// Kjøres automatisk den 1. og 15. hver måned (se vercel.json) — en ekte "hver 14. dag"
// finnes ikke i standard cron-syntaks, så dette er den nærmeste kalenderbaserte tilnærmingen.
//
// Henter den publiserte Google Sheet-tabellen Kondis.no sin 2027-ultraløpsartikkel lenker til,
// sammenligner mot races-tabellen, og legger KUN nye funn inn i digest_suggestions-køen
// (samme kø som Oppdateringer-fanen i admin viser) — alt som allerede er foreslått før
// (uansett om det ble godkjent, avvist eller fortsatt venter) hoppes over, slik at en avvist
// forslag ikke dukker opp på nytt hver syklus.

import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const config = { maxDuration: 60 };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SOURCE_URL =
  "https://www.kondis.no/idrett/104-av-139-norske-ultralop-har-bekreftet-dato-i-2027-se-pameldingsstatus-og-statistikk/1598074";
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRzVe1BZwKWOqKyqYdtl0nM2cZ5USu6KnYSy8eChaT2mEWJS_I5dg8zSLQlDrogXjcw_fbE7ybiXgwf/pub?gid=298238745&single=true&output=csv";

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip, \n handles the row break
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const FOOTNOTE_MARKERS = [
  "ikke blir arranger", "ikke er terminfestet", "kun startende på ultradistanse",
  "totalt på alle distanser", "antall løpere", "på backyard og lignende løp",
];

const GENERIC_DOMAINS = new Set([
  "facebook.com", "instagram.com", "sites.google.com", "canva.com",
  "racetracker.one", "eqtiming.com", "onreg.com", "letsreg.com",
  "racedays.run", "gotrail.run", "tikkio.com", "idrettenonline.no",
  "bedriftsidretten.no", "backyardultra.no", "msm.no",
]);

const STOPWORDS = new Set(["backyard", "ultra", "trail", "lop", "race", "run", "frontyard", "og", "i"]);

function norm(s) {
  if (!s) return "";
  s = s.toLowerCase().replace(/\*\*/g, "").replace(/\(.*?\)/g, "").replace(/#/g, " ");
  s = s.replace(/æ/g, "a").replace(/ø/g, "o").replace(/å/g, "a");
  s = s.replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  return s;
}

function domainOf(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

function parseKondisDate(raw) {
  const d = raw.trim().replace(/\.$/, "");
  const m = d.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const mon = parseInt(m[2], 10);
  return `2027-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function cleanName(name) {
  return name.replace(/\*+/g, "").trim();
}

function findMatch(k, byNorm, byDomain, allRaces) {
  const exact = byNorm.get(k.norm);
  if (exact) return { race: exact, how: "name" };

  for (const r of allRaces) {
    if (!r.norm || !k.norm) continue;
    if ((r.norm.includes(k.norm) || k.norm.includes(r.norm)) && r.norm.length >= 5) {
      return { race: r, how: "substring" };
    }
  }

  if (k.domain && !GENERIC_DOMAINS.has(k.domain)) {
    const owners = byDomain.get(k.domain);
    if (owners && owners.length === 1) {
      const kwords = new Set(k.norm.split(" ").filter((w) => w.length >= 4 && !STOPWORDS.has(w)));
      const rwords = new Set(owners[0].norm.split(" ").filter((w) => w.length >= 4 && !STOPWORDS.has(w)));
      for (const w of kwords) {
        if (rwords.has(w)) return { race: owners[0], how: "domain" };
      }
    }
  }

  return { race: null, how: null };
}

async function sendNotification(dateMismatchCount, newRaceCount) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || !process.env.REPORT_EMAIL) return;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  await transporter.sendMail({
    from: `"Langeløp.no" <${process.env.GMAIL_USER}>`,
    to: process.env.REPORT_EMAIL,
    subject: `📋 Kondis-sammenligning: ${dateMismatchCount + newRaceCount} nye forslag`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;">
        <h2 style="font-size:17px;">Ny sammenligning mot Kondis.no sin ultraløp-oversikt</h2>
        <p style="font-size:14px;color:#444;">
          ${dateMismatchCount} datokorrigering(er) og ${newRaceCount} nye løp-kandidat(er) er lagt i
          Oppdateringer-køen i admin, klare til gjennomgang.
        </p>
        <p style="font-size:12px;color:#999;">Kjøres automatisk ca. hver 14. dag (1. og 15. i måneden).</p>
      </div>
    `,
  });
}

export default async function handler(req, res) {
  const isCron = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  const isAdmin = req.headers["x-admin-password"] === process.env.ADMIN_PASSWORD;
  if (!isCron && !isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const csvRes = await fetch(SHEET_CSV_URL);
  if (!csvRes.ok) {
    return res.status(502).json({ error: `Klarte ikke hente Kondis-arket (status ${csvRes.status})` });
  }
  const csvText = await csvRes.text();
  const rows = parseCSV(csvText);

  const { data: races, error: racesError } = await supabase.from("races").select("id, slug, name, date, url");
  if (racesError) return res.status(500).json({ error: racesError.message });

  const db = races.map((r) => ({ ...r, norm: norm(r.name), domain: domainOf(r.url) }));
  const byNorm = new Map();
  const byDomain = new Map();
  for (const r of db) {
    if (!byNorm.has(r.norm)) byNorm.set(r.norm, r);
    if (r.domain) {
      if (!byDomain.has(r.domain)) byDomain.set(r.domain, []);
      byDomain.get(r.domain).push(r);
    }
  }

  const kondis = [];
  for (const r of rows.slice(2)) {
    if (r.length < 15) continue;
    const [dateRaw, nameRaw, distance, , , , , , , , website, , , link] = r;
    const name = (nameRaw || "").trim();
    if (!name) continue;
    if (FOOTNOTE_MARKERS.some((m) => name.toLowerCase().includes(m))) continue;
    const url = (website || "").trim() || (link || "").trim() || null;
    kondis.push({
      dateRaw: (dateRaw || "").trim(),
      date: parseKondisDate(dateRaw || ""),
      name,
      distance: (distance || "").trim(),
      website: url,
      norm: norm(name),
      domain: domainOf(url),
    });
  }

  // Hva er allerede foreslått før (uansett status) — ikke dupliser
  const { data: existing, error: existingError } = await supabase
    .from("digest_suggestions")
    .select("type, race_slug, race_name, fields")
    .eq("source_url", SOURCE_URL);
  if (existingError) return res.status(500).json({ error: existingError.message });

  const existingUpdateKeys = new Set(
    existing.filter((s) => s.type === "race_update").map((s) => `${s.race_slug}|${s.fields?.date}`)
  );
  const existingNewRaceKeys = new Set(
    existing.filter((s) => s.type === "new_race").map((s) => norm(s.race_name))
  );

  const toInsert = [];

  for (const k of kondis) {
    const { race: m, how } = findMatch(k, byNorm, byDomain, db);
    if (m) {
      if (k.date && m.date !== k.date) {
        const key = `${m.slug}|${k.date}`;
        if (!existingUpdateKeys.has(key)) {
          toInsert.push({
            type: "race_update",
            race_slug: m.slug,
            race_name: cleanName(m.name),
            summary: `Kondis.no sin 2027-oversikt oppgir bekreftet dato ${k.date} (${k.dateRaw}) for dette løpet — avviker fra datoen i databasen. (match: ${how})`,
            fields: { date: k.date },
            source_url: SOURCE_URL,
            raw_snippet: `Kondis-rad: ${k.dateRaw} | ${k.name} | ${k.distance} | ${k.website || ""}`.slice(0, 2000),
          });
        }
      }
    } else {
      const key = norm(cleanName(k.name));
      if (!existingNewRaceKeys.has(key)) {
        toInsert.push({
          type: "new_race",
          race_slug: null,
          race_name: cleanName(k.name),
          summary: `Funnet i Kondis.no sin 2027-oversikt over norske ultraløp, men ikke i databasen. ${
            k.date ? `Dato: ${k.date}` : "Ingen bekreftet dato oppgitt."
          }`,
          fields: { date: k.date, url: k.website },
          source_url: SOURCE_URL,
          raw_snippet: `Kondis-rad: ${k.dateRaw} | ${k.name} | ${k.distance} | ${k.website || ""}`.slice(0, 2000),
        });
      }
    }
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("digest_suggestions").insert(toInsert);
    if (insertError) return res.status(500).json({ error: insertError.message });

    const dateMismatchCount = toInsert.filter((r) => r.type === "race_update").length;
    const newRaceCount = toInsert.filter((r) => r.type === "new_race").length;
    try {
      await sendNotification(dateMismatchCount, newRaceCount);
    } catch (err) {
      console.error("E-postvarsel feilet:", err);
    }
  }

  return res.status(200).json({ ok: true, inserted: toInsert.length, checked: kondis.length });
}
