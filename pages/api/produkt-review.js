import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendReviewNotification({ produkt_id, navn, email, rating, kommentar }) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

    await transporter.sendMail({
      from: `"Langeløp.no" <${process.env.GMAIL_USER}>`,
      replyTo: 'post@langelop.no',
      to: process.env.REPORT_EMAIL,
      subject: `⭐ Ny anmeldelse – ${produkt_id}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;color:#111;">
          <h2 style="margin:0 0 16px;">Ny anmeldelse venter godkjenning</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#666;width:100px;">Produkt</td><td style="padding:6px 0;">${produkt_id}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Navn</td><td style="padding:6px 0;">${navn}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">E-post</td><td style="padding:6px 0;">${email}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Stjerner</td><td style="padding:6px 0;font-size:16px;">${stars}</td></tr>
          </table>
          ${kommentar ? `<p style="margin-top:14px;background:#f5f5f5;padding:12px;border-radius:8px;font-size:14px;">${kommentar}</p>` : ''}
          <p style="margin-top:20px;font-size:13px;color:#888;">Gå inn i Supabase og sett <code>approved = true</code> for å publisere.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Varsling feilet:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { produkt_id, navn, email, rating, kommentar, image_url } = req.body;

  if (!produkt_id || !navn || !email || !rating) {
    return res.status(400).json({ error: 'Alle felt er påkrevd.' });
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Ugyldig stjernerangering.' });
  }

  const { error } = await supabase.from('produkt_reviews').insert([{
    produkt_id,
    navn,
    email,
    rating,
    kommentar: kommentar || null,
    image_url: image_url || null,
    approved: false,
  }]);

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Du har allerede anmeldt dette produktet.' });
    }
    return res.status(500).json({ error: 'Noe gikk galt. Prøv igjen.' });
  }

  await sendReviewNotification({ produkt_id, navn, email, rating, kommentar });

  return res.status(201).json({ ok: true });
}
