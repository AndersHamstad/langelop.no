// pages/api/cron/daily-report.js
// Kjøres automatisk hver dag kl. 07:00 via Vercel Cron (se vercel.json)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Supabase: nye nyhetsbrevabonnenter ---
async function getNewsletterStats() {
  const now = new Date();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterday.toISOString())
    .lt('created_at', todayStart.toISOString());

  const { count: total } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true });

  if (error) console.error('Supabase error:', error);

  return { newYesterday: count ?? 0, total: total ?? 0 };
}

// --- Vercel Analytics: besøkende ---
async function getVercelStats() {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const token = process.env.VERCEL_API_TOKEN;

  const headers = { Authorization: `Bearer ${token}` };
  const base = `https://vercel.com/api/web-analytics/timeseries`;

  async function fetchVisitors(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const url = `${base}?projectId=${projectId}&startAt=${start.getTime()}&endAt=${end.getTime()}&environment=production&filter=%7B%7D`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const json = await res.json();

    // Summer alle visitors på tvers av datapunkter
    const total = (json.data ?? []).reduce((sum, d) => sum + (d.visitors ?? 0), 0);
    return total;
  }

  const [yesterday, week, month] = await Promise.all([
    fetchVisitors(1),
    fetchVisitors(7),
    fetchVisitors(30),
  ]);

  return { yesterday, week, month };
}

// --- MailerLite: send e-post ---
async function sendEmail({ newsletter, visitors }) {
  const { newYesterday, total } = newsletter;
  const v = visitors;

  const formatNum = (n) => (n === null ? 'Ikke tilgjengelig' : n.toLocaleString('nb-NO'));

  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
      <h2 style="font-size: 20px; margin-bottom: 4px;">📊 Daglig rapport – Langeløp.no</h2>
      <p style="color: #666; font-size: 14px; margin-top: 0;">${new Date().toLocaleDateString('nb-NO', { dateStyle: 'long' })}</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
        <tr>
          <td colspan="2" style="font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; padding-bottom: 8px;">
            Nyhetsbrev
          </td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 10px 12px; border-radius: 6px 0 0 6px;">Nye abonnenter i går</td>
          <td style="padding: 10px 12px; font-weight: bold; text-align: right; border-radius: 0 6px 6px 0;">${newYesterday}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px;">Totalt antall abonnenter</td>
          <td style="padding: 10px 12px; font-weight: bold; text-align: right;">${formatNum(total)}</td>
        </tr>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-top: 28px;">
        <tr>
          <td colspan="2" style="font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; padding-bottom: 8px;">
            Besøkende
          </td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 10px 12px; border-radius: 6px 0 0 6px;">I går</td>
          <td style="padding: 10px 12px; font-weight: bold; text-align: right; border-radius: 0 6px 6px 0;">${formatNum(v.yesterday)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px;">Siste 7 dager</td>
          <td style="padding: 10px 12px; font-weight: bold; text-align: right;">${formatNum(v.week)}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="padding: 10px 12px; border-radius: 6px 0 0 6px;">Siste 30 dager</td>
          <td style="padding: 10px 12px; font-weight: bold; text-align: right; border-radius: 0 6px 6px 0;">${formatNum(v.month)}</td>
        </tr>
      </table>

      <p style="margin-top: 32px; font-size: 12px; color: #aaa;">
        Sendt automatisk fra Langeløp.no
      </p>
    </div>
  `;

  const res = await fetch('https://connect.mailerlite.com/api/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'rapport@langelop.no',
      from_name: 'Langeløp.no',
      to: [{ email: process.env.REPORT_EMAIL }],
      subject: `📊 Daglig rapport – ${new Date().toLocaleDateString('nb-NO')}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MailerLite feil: ${err}`);
  }

  return res.json();
}

export default async function handler(req, res) {
  // Sikre at bare Vercel Cron (eller deg selv) kan kalle denne
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [newsletter, visitors] = await Promise.all([
      getNewsletterStats(),
      getVercelStats(),
    ]);

    await sendEmail({ newsletter, visitors });

    return res.status(200).json({ ok: true, newsletter, visitors });
  } catch (err) {
    console.error('Daily report error:', err);
    return res.status(500).json({ error: err.message });
  }
}
