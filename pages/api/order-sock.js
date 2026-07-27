import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getPricing(qty) {
  if (qty <= 0) return { price: 0, shipping: 0 };
  if (qty === 1) return { price: 249, shipping: 69 };
  if (qty === 2) return { price: 449, shipping: 69 };
  return { price: 649 + (qty - 3) * 200, shipping: 0 };
}

async function sendEmails({ name, email, size, quantity, address, postalCode, city }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const { price, shipping } = getPricing(quantity);
  const total = price + shipping;

  const tableRow = (label, value) =>
    `<tr><td style="padding:6px 0;color:#666;width:130px;">${label}</td><td style="padding:6px 0;">${value}</td></tr>`;

  const sharedTableStyle = `width:100%;border-collapse:collapse;font-size:14px;`;
  const divider = `<hr style="border:none;border-top:1px solid #eee;margin:14px 0;">`;

  const from = `"Langeløp.no" <${process.env.GMAIL_USER}>`;
  const replyTo = "post@langelop.no";

  // Admin email
  await transporter.sendMail({
    from,
    replyTo,
    to: process.env.REPORT_EMAIL,
    subject: `🧦 Ny sokkebestilling – ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;color:#111;">
        <h2 style="margin:0 0 16px;">Ny sokkebestilling</h2>
        <table style="${sharedTableStyle}">
          ${tableRow("Navn", name)}
          ${tableRow("E-post", email)}
          ${tableRow("Størrelse", size)}
          ${tableRow("Antall par", quantity)}
          ${tableRow("Adresse", `${address}, ${postalCode} ${city}`)}
        </table>
        ${divider}
        <table style="${sharedTableStyle}">
          ${tableRow("Pris", `${price} kr`)}
          ${tableRow("Frakt", shipping === 0 ? "Gratis" : `${shipping} kr`)}
          ${tableRow("<strong>Totalt</strong>", `<strong>${total} kr</strong>`)}
        </table>
        <p style="margin-top:20px;background:#f5f5f5;padding:12px;border-radius:8px;font-size:13px;color:#444;">
          Send en Vipps-forespørsel på <strong>${total} kr</strong> til ${email}, og pakk inn bestillingen.
        </p>
      </div>
    `,
  });

  // Customer email
  await transporter.sendMail({
    from,
    replyTo,
    to: email,
    subject: `Bestilling mottatt – Langeløp-sokker`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;color:#111;">
        <p style="display:inline-block;background:#d1fae5;color:#065f46;font-size:12px;font-weight:600;padding:3px 10px;border-radius:6px;margin:0 0 16px;">
          Bestilling mottatt
        </p>
        <h2 style="margin:0 0 6px;">Hei ${name},</h2>
        <p style="margin:0 0 16px;color:#444;">Takk for bestillingen! Her er et sammendrag:</p>
        <table style="${sharedTableStyle}">
          ${tableRow("Produkt", "Langeløp-sokker")}
          ${tableRow("Størrelse", size)}
          ${tableRow("Antall par", quantity)}
          ${tableRow("Leveringsadresse", `${address}, ${postalCode} ${city}`)}
        </table>
        ${divider}
        <table style="${sharedTableStyle}">
          ${tableRow("Pris", `${price} kr`)}
          ${tableRow("Frakt", shipping === 0 ? "Gratis" : `${shipping} kr`)}
          ${tableRow("<strong>Totalt</strong>", `<strong>${total} kr</strong>`)}
        </table>
        <p style="margin-top:20px;">
          Du mottar snart en Vipps-forespørsel på <strong>${total} kr</strong>.
          Sokkene sendes så fort betalingen er registrert.
        </p>
        <p>Spørsmål? Svar på denne e-posten.</p>
        <p style="margin-top:24px;">Lykke til på neste løp!<br><strong>Anders · langeløp.no</strong></p>
      </div>
    `,
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, size, quantity, address, postalCode, city } = req.body ?? {};

    if (!name || !email || !size || !quantity || !address || !postalCode || !city) {
      return res.status(400).json({ error: "Alle felter må fylles ut." });
    }

    const { price: p, shipping: s } = getPricing(quantity);
    const { error } = await supabase.from("sock_orders").insert([
      {
        name,
        email,
        size,
        quantity,
        address,
        postal_code: postalCode,
        city,
        status: "pending_payment",
        total_price: p + s,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Kunne ikke lagre bestillingen." });
    }

    await sendEmails({ name, email, size, quantity, address, postalCode, city });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Noe gikk galt." });
  }
}
