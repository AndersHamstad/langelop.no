// pages/api/sock-inquiry.js
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendNotification(data) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"Langeløp.no" <${process.env.GMAIL_USER}>`,
      to: process.env.REPORT_EMAIL,
      subject: `🧦 Ny sokkehenvendelse: ${data.race_name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; color: #111;">
          <h2>Ny henvendelse om tilpassede sokker</h2>
          <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:6px 0; color:#555;">Løp</td><td style="padding:6px 0; font-weight:bold;">${data.race_name}</td></tr>
            <tr><td style="padding:6px 0; color:#555;">Løpsdato</td><td style="padding:6px 0;">${data.race_date || "–"}</td></tr>
            <tr><td style="padding:6px 0; color:#555;">Antall (ca.)</td><td style="padding:6px 0;">${data.estimated_quantity || "–"}</td></tr>
            <tr><td style="padding:6px 0; color:#555;">Kontakt</td><td style="padding:6px 0;">${data.contact_name} (${data.contact_email}${data.contact_phone ? `, ${data.contact_phone}` : ""})</td></tr>
          </table>
          ${data.message ? `<p style="margin-top:16px;background:#f9f9f9;padding:12px;border-radius:8px;">${data.message}</p>` : ""}
        </div>
      `,
    });
  } catch (err) {
    console.error("Varsling feilet:", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { race_name, contact_name, contact_email, contact_phone, estimated_quantity, race_date, message } = req.body;

  if (!race_name || !contact_name || !contact_email) {
    return res.status(400).json({ error: "Løpsnavn, kontaktperson og e-post er påkrevd." });
  }

  const { error } = await supabase.from("sock_inquiries").insert([{
    race_name,
    contact_name,
    contact_email,
    contact_phone: contact_phone || null,
    estimated_quantity: estimated_quantity || null,
    race_date: race_date || null,
    message: message || null,
  }]);

  if (error) return res.status(500).json({ error: "Noe gikk galt. Prøv igjen." });

  sendNotification({ race_name, contact_name, contact_email, contact_phone, estimated_quantity, race_date, message });
  return res.status(201).json({ ok: true });
}
