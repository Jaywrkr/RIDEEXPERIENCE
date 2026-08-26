// Boton "agregar a mi calendario" de la confirmacion: genera un .ics
// client-side y lo dispara como descarga. Sin backend ni dependencias,
// funciona igual en Google Calendar, Apple Calendar y Outlook porque
// .ics es el formato que los tres importan de forma nativa.
import { EVENT_DATE } from './countdown.js';

// Duracion del convoy: entra el 25, sale el 27 (ver la hoja de visado).
// Se calcula a partir de EVENT_DATE en vez de escribir la fecha de
// salida de nuevo, para no sumar un cuarto lugar donde vive la fecha
// del evento (ver docs/PROXIMAS_FASES.md).
const DURACION_DIAS = 2;

function formatoIcs(fecha) {
  return fecha.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function construirIcs({ serial }) {
  const inicio = EVENT_DATE;
  const fin = new Date(inicio.getTime() + DURACION_DIAS * 24 * 60 * 60 * 1000);
  const ahora = formatoIcs(new Date());

  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shineray Motors//A Todo Terreno//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${serial}@atodoterreno.shineray`,
    `DTSTAMP:${ahora}`,
    `DTSTART:${formatoIcs(inicio)}`,
    `DTEND:${formatoIcs(fin)}`,
    'SUMMARY:A Todo Terreno · Convención Nacional Shineray 2026',
    'DESCRIPTION:Sales con el convoy. El destino se revela al llegar. Consulta con tu asesor el lugar de embarque.',
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
