// pages/api/produkt-review.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { produkt_id, navn, email, rating, kommentar } = req.body;

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
    approved: false,
  }]);

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Du har allerede anmeldt dette produktet.' });
    }
    return res.status(500).json({ error: 'Noe gikk galt. Prøv igjen.' });
  }

  return res.status(201).json({ ok: true });
}
