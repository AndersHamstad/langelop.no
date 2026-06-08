// pages/api/cron/daily-report.js
// Kjøres automatisk hver dag kl. 07:00 via Vercel Cron (se vercel.json)

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

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
  const teamId = process.env.VERCEL_TEAM_ID;
  const base = `https://vercel.com/api/web-analytics/timeseries`;

  async function fetchVisitors(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const from = start.toISOString().slice(0, 10);
    const to = end.toISOString().slice(0, 10);

    const url = `${base}?projectId=${projectId}&teamId=${teamId}&from=${from}&to=${to}&environment=production&filter=%7B%7D`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const json = await res.json();

    // Summer unike enheter (devices) på tvers av alle datapunkter
    const groups = json.data?.groups?.all ?? [];
    const total = groups.reduce((sum, d) => sum + (d.devices ?? 0), 0);
    return total;
  }

  const [yesterday, week, month] = await Promise.all([
    fetchVisitors(1),
    fetchVisitors(7),
    fetchVisitors(30),
  ]);

  return { yesterday, week, month };
}

// --- Gmail: send e-post via nodemailer ---
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

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Langeløp.no" <${process.env.GMAIL_USER}>`,
    to: process.env.REPORT_EMAIL,
    subject: `📊 Daglig rapport – ${new Date().toLocaleDateString('nb-NO')}`,
    html,
  });
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
