// pages/api/newsletter-subscribe.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-post er påkrevd.' });

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ email }]);

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Denne e-posten er allerede registrert.' });
    }
    return res.status(500).json({ error: 'Noe gikk galt. Prøv igjen.' });
  }

  return res.status(201).json({ ok: true });
}
