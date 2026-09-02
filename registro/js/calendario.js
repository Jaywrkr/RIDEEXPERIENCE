// Boton "agregar a mi calendario" de la confirmacion: genera un .ics
// client-side y lo dispara como descarga. Sin backend ni dependencias,
// funciona igual en Google Calendar, Apple Calendar y Outlook porque
// .ics es el formato que los tres importan de forma nativa.
import { EVENT_DATE, EVENT_END_DATE } from './countdown.js';

function formatoIcs(fecha) {
  return fecha.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function construirIcs({ serial }) {
  const inicio = EVENT_DATE;
  const fin = EVENT_END_DATE;
  const ahora = formatoIcs(new Date());

  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shineray//A Todo Terreno//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${serial}@atodoterreno.shineray`,
    `DTSTAMP:${ahora}`,
    `DTSTART:${formatoIcs(inicio)}`,
    `DTEND:${formatoIcs(fin)}`,
    'SUMMARY:A Todo Terreno · Convención Shineray 2026',
    'DESCRIPTION:Sales con el convoy. El destino se revela al llegar. Consulta con tu asesor el lugar de encuentro.',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  // Los .ics usan CRLF como separador de linea.
  return lineas.join('\r\n');
}

export function initAgregarCalendario() {
  const boton = document.getElementById('btnCalendario');
  if (!boton) return;

  boton.addEventListener('click', () => {
    const serial = document.getElementById('confSerial')?.textContent?.trim() || 'ATT';
    const ics = construirIcs({ serial });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'a-todo-terreno.ics';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  });
}
