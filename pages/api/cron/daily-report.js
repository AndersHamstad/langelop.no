// pages/api/cron/daily-report.js
// Kjøres automatisk hver dag kl. 07:00 via Vercel Cron (se vercel.json)

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [subscribers, totalSubscribersRes, utstyrReviews, produktReviews, raceSubmissions, raceUpdates] =
    await Promise.all([
      supabase.from('newsletter_subscribers').select('email, created_at').gte('created_at', since),
      supabase.from('newsletter_subscribers').select('email'),
      supabase.from('utstyr_reviews').select('produkt_id, navn, rating, kommentar, created_at').gte('created_at', since),
      supabase.from('produkt_reviews').select('produkt_id, navn, rating, kommentar, created_at').gte('created_at', since),
      supabase.from('race_submissions').select('navn, dato, distanse, sted, region, kontakt_navn, kontakt_epost, created_at').gte('created_at', since),
      supabase.from('race_updates').select('lop_navn, endring, kontakt_epost, created_at').gte('created_at', since),
    ]);

  const newCount = subscribers.data?.length || 0;
  const totalCount = totalSubscribersRes.data?.length ?? 0;
  const total =
    newCount +
    (utstyrReviews.data?.length || 0) +
    (produktReviews.data?.length || 0) +
    (raceSubmissions.data?.length || 0) +
    (raceUpdates.data?.length || 0);

  if (total === 0) {
    console.log('Ingen nye hendelser siste 24t – hopper over e-post.');
    return res.status(200).json({ ok: true, sent: false });
  }

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
  const fmt = (d) => new Date(d).toLocaleString('nb-NO', { dateStyle: 'short', timeStyle: 'short' });

  function section(emoji, title, items, renderRow) {
    if (!items?.length) return '';
    return `
      <h2 style="font-size:15px;margin:28px 0 8px;color:#111;border-top:1px solid #eee;padding-top:20px;">
        ${emoji} ${title} <span style="color:#999;font-weight:normal;">(${items.length})</span>
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        ${items.map((r) => `<tr>${renderRow(r).map(c =>
          `<td style="padding:6px 8px;border-bottom:1px solid #f5f5f5;color:#333;vertical-align:top;">${c}</td>`
        ).join('')}</tr>`).join('')}
      </table>
    `;
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;color:#111;">
      <h1 style="font-size:20px;margin-bottom:4px;">Daglig oppdatering – langelop.no</h1>
      <p style="color:#888;font-size:13px;margin-bottom:8px;">
        ${new Date().toLocaleDateString('nb-NO', { dateStyle: 'long' })} &nbsp;·&nbsp;
        ${total} nye hendelse${total !== 1 ? 'r' : ''} siste 24 timer
      </p>

      <div style="background:#f9f9f9;border-radius:8px;padding:12px 16px;font-size:13px;margin-bottom:8px;display:flex;gap:24px;flex-wrap:wrap;">
        <span>Nyhetsbrev: <b>${totalCount}</b> abonnenter${newCount > 0 ? ` <span style="color:#16a34a;font-weight:bold;">+${newCount} nye</span>` : ''}</span>
      </div>


      ${section('', 'Nye nyhetsbrevabonnenter', subscribers.data,
        (r) => [r.email, fmt(r.created_at)]
      )}

      ${section('', 'Innmeldte løp', raceSubmissions.data,
        (r) => [`<b>${r.navn}</b>`, r.dato, r.distanse, `${r.sted}, ${r.region}`, `${r.kontakt_navn}<br/>${r.kontakt_epost}`]
      )}

      ${section('', 'Oppdateringsforslag', raceUpdates.data,
        (r) => [`<b>${r.lop_navn}</b>`, r.endring, r.kontakt_epost]
      )}

      ${section('', 'Sokke-anmeldelser (til godkjenning)', produktReviews.data,
        (r) => [`<b>${r.navn}</b>`, stars(r.rating), r.kommentar || '–']
      )}

      ${section('', 'Utstyrsanmeldelser (til godkjenning)', utstyrReviews.data,
        (r) => [`<b>${r.produkt_id}</b>`, r.navn, stars(r.rating), r.kommentar || '–']
      )}

      <p style="margin-top:32px;font-size:11px;color:#bbb;">
        Anmeldelser godkjennes i Supabase-dashbordet. Sendt automatisk fra langelop.no.
      </p>
    </div>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: `"Langeløp.no" <${process.env.GMAIL_USER}>`,
      to: process.env.REPORT_EMAIL,
      subject: `📊 Daglig rapport – ${total} nye hendelse${total !== 1 ? 'r' : ''} · ${new Date().toLocaleDateString('nb-NO')}`,
      html,
    });
  } catch (err) {
    console.error('E-post feilet:', err);
    return res.status(500).json({ error: 'E-post feilet' });
  }

  return res.status(200).json({ ok: true, sent: true, total });
}
