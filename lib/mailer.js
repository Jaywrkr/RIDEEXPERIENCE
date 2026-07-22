import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function linkPasaporte(codigo) {
  const base = process.env.SITE_URL || 'https://tudominio.com';
  return `${base}/?codigo=${encodeURIComponent(codigo)}`;
}

const ASUNTOS = {
  2: 'Ya está disponible tu segundo sello — Convención Nacional Shineray 2026',
  3: 'Ya está disponible tu tercer sello — Convención Nacional Shineray 2026',
};

function cuerpoHtml(n, codigo) {
  const url = linkPasaporte(codigo);
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #2a2118;">
      <p>Tu pasaporte de la Convención Nacional Shineray 2026 tiene un nuevo sello esperando.</p>
      <p>Entrá con tu código para verlo:</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${url}" style="background:#c41e1e; color:#fff; padding:12px 24px; border-radius:4px; text-decoration:none; font-weight:bold;">
          Ver mi sello ${n}
        </a>
      </p>
      <p>O escribí tu código directamente en la web: <strong>${codigo}</strong></p>
    </div>
  `;
}

// Envía el aviso de "nuevo sello disponible" para el sello 2 o 3.
// No otorga el sello: eso ocurre cuando la persona efectivamente entra.
export async function enviarNotificacionSello(n, { email, codigo }) {
  if (!email) return;
  await resend.emails.send({
    from: process.env.RESEND_FROM || 'Convención Shineray <no-reply@tudominio.com>',
    to: email,
    subject: ASUNTOS[n],
    html: cuerpoHtml(n, codigo),
  });
}
