// pages/api/comments.js
// ✅ KRITISK FIX: Kommentarinnsending går via server, ikke direkte fra klient.
// Supabase service-nøkkel brukes kun her – aldri eksponert til nettleseren.

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role – kun server-side
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { race_id, name, email, comment } = req.body;

  // Server-side validering
  if (!race_id || !name || !email || !comment) {
    return res.status(400).json({ error: 'Alle felt er påkrevd.' });
  }

  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Navn må være minst 2 tegn.' });
  }

  if (typeof comment !== 'string' || comment.trim().length < 10) {
    return res.status(400).json({ error: 'Kommentaren må være minst 10 tegn.' });
  }

  // Enkel e-postvalidering
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Ugyldig e-postadresse.' });
  }

  // ✅ approved: false – kommentarer modereres før de vises
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

  return res.status(201).json({ comment: data });
}