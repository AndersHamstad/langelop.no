// pages/api/utstyr-review.js
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendNotification({ produktId, navn, stjerner, kommentar }) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    const stars = '★'.repeat(stjerner) + '☆'.repeat(5 - stjerner);
    await transporter.sendMail({
      from: `"Langeløp.no" <${process.env.GMAIL_USER}>`,
      to: process.env.REPORT_EMAIL,
      subject: `⭐ Ny utstyrsanmeldelse – ${produktId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; color: #111;">
          <h2 style="font-size: 18px;">Ny anmeldelse til godkjenning</h2>
          <p><b>Produkt:</b> ${produktId}</p>
          <p><b>Fra:</b> ${navn}</p>
          <p><b>Stjerner:</b> ${stars}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
          <p style="background:#f9f9f9;padding:12px;border-radius:8px;">${kommentar}</p>
          <p style="margin-top:24px;font-size:12px;color:#aaa;">Godkjenn i Supabase-dashbordet.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Varsling feilet:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { produkt_id, navn, email, stjerner, kommentar } = req.body;

  if (!produkt_id || !navn || !email || !stjerner || !kommentar) {
    return res.status(400).json({ error: 'Alle felt er påkrevd.' });
  }
  if (typeof stjerner !== 'number' || stjerner < 1 || stjerner > 5) {
    return res.status(400).json({ error: 'Ugyldig stjernerangering.' });
  }
  if (kommentar.trim().length < 10) {
    return res.status(400).json({ error: 'Kommentaren må være minst 10 tegn.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Ugyldig e-postadresse.' });
  }

  const { data, error } = await supabase
    .from('utstyr_reviews')
    .insert([{
      produkt_id: produkt_id.trim(),
      navn: navn.trim(),
      email: email.trim().toLowerCase(),
      stjerner,
      kommentar: kommentar.trim(),
      approved: false,
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Du har allerede anmeldt dette produktet.' });
    }
    return res.status(500).json({ error: 'Noe gikk galt. Prøv igjen.' });
  }

  sendNotification({ produktId: produkt_id, navn, stjerner, kommentar });

  return res.status(201).json({ review: data });
}
