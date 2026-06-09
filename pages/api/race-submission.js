// pages/api/race-submission.js
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendNotification(type, data) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const isNew = type === 'new';

    await transporter.sendMail({
      from: `"Langeløp.no" <${process.env.GMAIL_USER}>`,
      to: process.env.REPORT_EMAIL,
      subject: isNew ? `🏁 Nytt løp innmeldt: ${data.navn}` : `✏️ Oppdatering foreslått: ${data.lop_navn}`,
      html: isNew ? `
        <div style="font-family: sans-serif; max-width: 520px; color: #111;">
          <h2>Nytt løp innmeldt</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:6px 0; color:#555;">Navn</td><td style="padding:6px 0; font-weight:bold;">${data.navn}</td></tr>
            <tr><td style="padding:6px 0; color:#555;">Dato</td><td style="padding:6px 0;">${data.dato}</td></tr>
            <tr><td style="padding:6px 0; color:#555;">Distanse</td><td style="padding:6px 0;">${data.distanse}</td></tr>
            <tr><td style="padding:6px 0; color:#555;">Sted</td><td style="padding:6px 0;">${data.sted}, ${data.region}</td></tr>
            <tr><td style="padding:6px 0; color:#555;">Nettside</td><td style="padding:6px 0;">${data.nettside || '–'}</td></tr>
            <tr><td style="padding:6px 0; color:#555;">Kontakt</td><td style="padding:6px 0;">${data.kontakt_navn} (${data.kontakt_epost})</td></tr>
          </table>
          ${data.beskrivelse ? `<p style="margin-top:16px;background:#f9f9f9;padding:12px;border-radius:8px;">${data.beskrivelse}</p>` : ''}
          <p style="margin-top:24px;font-size:12px;color:#aaa;">Legg inn i Supabase for å publisere.</p>
        </div>
      ` : `
        <div style="font-family: sans-serif; max-width: 520px; color: #111;">
          <h2>Oppdatering foreslått</h2>
          <p><b>Løp:</b> ${data.lop_navn}</p>
          <p><b>Fra:</b> ${data.kontakt_epost}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
          <p style="background:#f9f9f9;padding:12px;border-radius:8px;">${data.endring}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Varsling feilet:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, ...data } = req.body;

  if (type === 'new') {
    const { navn, dato, distanse, sted, region, kontakt_navn, kontakt_epost } = data;
    if (!navn || !dato || !distanse || !sted || !region || !kontakt_navn || !kontakt_epost) {
      return res.status(400).json({ error: 'Alle påkrevde felt må fylles ut.' });
    }

    const { error } = await supabase.from('race_submissions').insert([{
      navn, dato, distanse, sted, region,
      nettside: data.nettside || null,
      kontakt_navn, kontakt_epost,
      beskrivelse: data.beskrivelse || null,
    }]);

    if (error) return res.status(500).json({ error: 'Noe gikk galt. Prøv igjen.' });
    sendNotification('new', data);
    return res.status(201).json({ ok: true });
  }

  if (type === 'update') {
    const { lop_navn, endring, kontakt_epost } = data;
    if (!lop_navn || !endring || !kontakt_epost) {
      return res.status(400).json({ error: 'Alle felt må fylles ut.' });
    }

    const { error } = await supabase.from('race_updates').insert([{
      lop_navn, endring, kontakt_epost,
    }]);

    if (error) return res.status(500).json({ error: 'Noe gikk galt. Prøv igjen.' });
    sendNotification('update', data);
    return res.status(201).json({ ok: true });
  }

  return res.status(400).json({ error: 'Ugyldig type.' });
}
