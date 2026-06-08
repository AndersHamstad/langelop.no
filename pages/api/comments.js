// pages/api/comments.js
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendCommentNotification({ raceName, raceId, name, comment }) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"Langeløp.no" <${process.env.GMAIL_USER}>`,
      to: process.env.REPORT_EMAIL,
      subject: `💬 Ny kommentar på ${raceName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; color: #111;">
          <h2 style="font-size: 18px;">Ny kommentar til godkjenning</h2>
          <p><b>Løp:</b> ${raceName} (${raceId})</p>
          <p><b>Fra:</b> ${name}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
          <p style="background:#f9f9f9;padding:12px;border-radius:8px;">${comment}</p>
          <p style="margin-top:24px;font-size:12px;color:#aaa;">Godkjenn eller avvis i Supabase-dashbordet.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Kommentar-varsling feilet:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { race_id, name, email, comment } = req.body;

  if (!race_id || !name || !email || !comment) {
    return res.status(400).json({ error: 'Alle felt er påkrevd.' });
  }
  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Navn må være minst 2 tegn.' });
  }
  if (typeof comment !== 'string' || comment.trim().length < 10) {
    return res.status(400).json({ error: 'Kommentaren må være minst 10 tegn.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Ugyldig e-postadresse.' });
  }

  // Hent løpsnavn for e-postvarsling
  const { data: race } = await supabaseAdmin
    .from('races')
    .select('name')
    .eq('id', race_id)
    .single();

  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert([{
      race_id,
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      comment: comment.trim(),
      approved: false,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Denne e-posten har allerede kommentert på dette løpet.' });
    }
    console.error('Supabase insert error:', error);
    return res.status(500).json({ error: 'Noe gikk galt. Prøv igjen.' });
  }

  // Send e-postvarsling (ikke-blokkerende)
  sendCommentNotification({
    raceName: race?.name || race_id,
    raceId: race_id,
    name: name.trim(),
    comment: comment.trim(),
  });

  return res.status(201).json({ comment: data });
}
