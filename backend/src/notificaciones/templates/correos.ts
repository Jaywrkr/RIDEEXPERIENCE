import { Evento } from '@prisma/client';

interface DatosCorreo {
  nombreAsistente: string;
  evento: Evento;
  sitioUrl?: string;
}

function formatearFecha(fecha: Date | null): string {
  if (!fecha) return 'una fecha por confirmar';
  return new Date(fecha).toLocaleString('es-EC', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Guayaquil',
  });
}

function envoltorioHtml(titulo: string, cuerpo: string, sitioUrl?: string): string {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 0 auto; color: #2a2118; line-height: 1.5;">
      <h2 style="margin-bottom: 4px;">${titulo}</h2>
      ${cuerpo}
      ${
        sitioUrl
          ? `<p style="margin-top: 24px;"><a href="${sitioUrl}" style="color:#c47a2f;">Ver información del evento</a></p>`
          : ''
      }
    </div>
  `;
}

/**
 * Copy generico por defecto. El texto especifico validado para un cliente
 * puntual (por ejemplo el de shineray-deck/index.html, slide "El mensaje
 * real") se puede reemplazar aca mismo antes de desplegar ese evento —
 * ver docs/PENDIENTES_CLIENTE.md.
 */
export const PlantillasCorreo = {
  confirmacion({ nombreAsistente, evento, sitioUrl }: DatosCorreo) {
    return {
      subject: `Registro confirmado — ${evento.nombre}`,
      html: envoltorioHtml(
        `¡Listo, ${nombreAsistente}!`,
        `<p>Tu registro para <strong>${evento.nombre}</strong> quedó confirmado.</p>
         <p>Lugar: ${evento.lugar}<br>Fecha: ${formatearFecha(evento.fechaInicio)}</p>
         <p>Te avisaremos por acá cuando haya novedades.</p>`,
        sitioUrl,
      ),
    };
  },

  avisoPrevio({ nombreAsistente, evento, sitioUrl }: DatosCorreo) {
    return {
      subject: `Se acerca ${evento.nombre}`,
      html: envoltorioHtml(
        `Hola ${nombreAsistente},`,
        `<p>Falta poco para <strong>${evento.nombre}</strong>. Guardá la fecha:</p>
         <p>Lugar: ${evento.lugar}<br>Fecha: ${formatearFecha(evento.fechaInicio)}</p>`,
        sitioUrl,
      ),
    };
  },

  avisoFinal({ nombreAsistente, evento, sitioUrl }: DatosCorreo) {
    return {
      subject: `Últimos días — ${evento.nombre}`,
      html: envoltorioHtml(
        `Ya casi, ${nombreAsistente}.`,
        `<p><strong>${evento.nombre}</strong> está por comenzar.</p>
         <p>Lugar: ${evento.lugar}<br>Fecha: ${formatearFecha(evento.fechaInicio)}</p>
         <p>Nos vemos ahí.</p>`,
        sitioUrl,
      ),
    };
  },
};
