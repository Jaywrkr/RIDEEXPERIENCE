import { Evento } from '@prisma/client';

interface DatosCorreo {
  nombreAsistente: string;
  evento: Evento;
  sitioUrl?: string;
  // Numero de pasaporte real (ATT-1001, ATT-1002...), ver
  // asistentes/codigo.util.ts. Opcional porque en teoria un correo podria
  // dispararse sin el, pero los tres tipos hoy siempre lo tienen.
  codigo?: string;
}

// Paleta y tipografia calcadas de :root en registro/css/style.css --
// mismos valores hex, para que el correo se sienta la continuacion del
// sitio y no un aviso generico aparte. Los clientes de correo no cargan
// @font-face de forma confiable, asi que el "look" de Discota/DIN Pro
// Black se imita con Arial/Helvetica en negrita + tracking ajustado en
// vez de intentar cargar las fuentes reales.
const COLOR = {
  arena: '#f3ead5',
  tinta: '#14110d',
  rojo: '#c41e1e',
  rojoDark: '#8f1414',
  hueso: '#f3eee2',
} as const;

function formatearFecha(fecha: Date | null): string {
  if (!fecha) return 'una fecha por confirmar';
  return new Date(fecha).toLocaleString('es-EC', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Guayaquil',
  });
}

// Las imagenes de marca (logo, sello) se sirven desde el sitio publico:
// un correo no puede empaquetar sus propios assets, necesita una URL
// http(s) absoluta. Sin REGISTRO_SITIO_URL configurada, el correo sigue
// siendo perfectamente legible -- simplemente sin el logo/sello, en vez
// de con una imagen rota.
function assetUrl(sitioUrl: string | undefined, archivo: string): string | null {
  if (!sitioUrl) return null;
  return `${sitioUrl.replace(/\/$/, '')}/assets/brand/${archivo}`;
}

/**
 * Envoltorio compartido por los 3 correos: misma cabecera oscura con
 * logo, mismo fondo de arena, mismo acento rojo y mismo pie de marca que
 * el sitio y el pasaporte. Todo en tablas + estilos inline porque es lo
 * único que Gmail/Outlook/Apple Mail renderizan igual de forma
 * consistente.
 */
function envoltorioHtml({
  overline,
  titulo,
  cuerpoHtml,
  codigo,
  sitioUrl,
}: {
  overline: string;
  titulo: string;
  cuerpoHtml: string;
  codigo?: string;
  sitioUrl?: string;
}): string {
  const logoUrl = assetUrl(sitioUrl, 'shineray-shm-logo-blanco.png');
  const selloUrl = assetUrl(sitioUrl, 'sello-aventura-garantizada.png');

  const encabezado = logoUrl
    ? `<img src="${logoUrl}" width="130" height="22" alt="Shineray SHM" style="display:block;border:0;">`
    : `<span style="font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:15px;letter-spacing:.04em;color:${COLOR.arena};">SHINERAY | SHM</span>`;

  const sello = selloUrl
    ? `<img src="${selloUrl}" width="64" height="64" alt="" style="display:block;margin:0 auto 18px;border:0;">`
    : '';

  const codigoBloque = codigo
    ? `
      <tr>
        <td align="center" style="padding:4px 28px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="background:${COLOR.hueso};border:1px solid rgba(20,17,13,.15);">
            <tr>
              <td style="padding:14px 28px;text-align:center;">
                <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(20,17,13,.55);">Pasaporte N.&ordm;</p>
                <p style="margin:0;font-family:'Courier New',Courier,monospace;font-weight:700;font-size:20px;letter-spacing:.04em;color:${COLOR.rojoDark};">${codigo}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  const ctaBloque = sitioUrl
    ? `
      <tr>
        <td align="center" style="padding:0 28px 32px;">
          <a href="${sitioUrl}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:13px;letter-spacing:.04em;color:${COLOR.tinta};text-decoration:none;border:1.5px solid rgba(20,17,13,.3);padding:10px 22px;">Ver mi pasaporte</a>
        </td>
      </tr>`
    : '';

  return `
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${COLOR.arena};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.arena};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${COLOR.hueso};border:1px solid rgba(20,17,13,.12);">

          <tr>
            <td style="background:${COLOR.tinta};padding:18px 28px;">
              ${encabezado}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:36px 28px 4px;">
              ${sello}
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${COLOR.rojo};">${overline}</p>
              <h1 style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:26px;line-height:1.15;letter-spacing:-.01em;color:${COLOR.tinta};">${titulo}</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 8px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.65;color:${COLOR.tinta};text-align:center;">
              ${cuerpoHtml}
            </td>
          </tr>
          ${codigoBloque}
          ${ctaBloque}

          <tr>
            <td style="background:${COLOR.tinta};padding:16px 28px;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(243,238,226,.45);">Shineray &mdash; Convenci&oacute;n Nacional 2026 &middot; A Todo Terreno</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const PlantillasCorreo = {
  confirmacion({ nombreAsistente, evento, sitioUrl, codigo }: DatosCorreo) {
    return {
      subject: `¡Ya estás dentro de la aventura A Todo Terreno!`,
      html: envoltorioHtml({
        overline: '¿El destino? Secreto hasta tu llegada.',
        titulo: `¡Ya estás dentro, ${nombreAsistente}!`,
        cuerpoHtml: `
          <p style="margin:0 0 14px;">Tu pasaporte para <strong>${evento.nombre}</strong> quedó sellado. Consulta con tu asesor el lugar de embarque.</p>
          <p style="margin:0;">Te enviaremos por acá las pistas clave del destino antes de la fecha — no hay forma de adelantarlas, así que revisa tu correo.</p>`,
        codigo,
        sitioUrl,
      }),
    };
  },

  avisoPrevio({ nombreAsistente, evento, sitioUrl, codigo }: DatosCorreo) {
    return {
      subject: `Se acerca ${evento.nombre}`,
      html: envoltorioHtml({
        overline: 'La cuenta regresiva ya empezó',
        titulo: `Falta poco, ${nombreAsistente}.`,
        cuerpoHtml: `
          <p style="margin:0 0 14px;">Prepárate: <strong>${evento.nombre}</strong> está cada vez más cerca.</p>
          <p style="margin:0;">Fecha: ${formatearFecha(evento.fechaInicio)}</p>`,
        codigo,
        sitioUrl,
      }),
    };
  },

  avisoFinal({ nombreAsistente, evento, sitioUrl, codigo }: DatosCorreo) {
    return {
      subject: `Últimos días — ${evento.nombre}`,
      html: envoltorioHtml({
        overline: 'Ya casi es hora',
        titulo: `Nos vemos ahí, ${nombreAsistente}.`,
        cuerpoHtml: `
          <p style="margin:0 0 14px;"><strong>${evento.nombre}</strong> está por comenzar.</p>
          <p style="margin:0;">Fecha: ${formatearFecha(evento.fechaInicio)}</p>`,
        codigo,
        sitioUrl,
      }),
    };
  },
};
