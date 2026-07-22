import { initReveal, initScrollCue, initTopbar, initHeroParallax, initSlideNav } from './reveal.js';
import { initPassportForm } from './passport.js';
import { initCountdown } from './countdown.js';
import { renderClues } from './clues.js';
import { initWelcome } from './welcome.js';

initWelcome();
initReveal();
initScrollCue();
initTopbar();
initHeroParallax();
initSlideNav();

let stopCountdown = null;

const SELLO_LABELS = { 1: 'Sello 1 · Registro', 2: 'Sello 2', 3: 'Sello 3' };
const FECHA_SELLO_FMT = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' });

function renderEstadoSellos(estado) {
  const lista = document.getElementById('confSellosLista');
  if (!lista || !estado) return;

  lista.innerHTML = '';
  [1, 2, 3].forEach((n) => {
    const sello = estado.sellos[n];
    if (!sello) return;

    let estadoTexto;
    if (sello.desbloqueado) {
      estadoTexto = `Conseguido el ${FECHA_SELLO_FMT.format(new Date(sello.fecha))}`;
    } else if (sello.disponibleDesde) {
      estadoTexto = `Disponible desde el ${FECHA_SELLO_FMT.format(new Date(sello.disponibleDesde))}`;
    } else {
      estadoTexto = 'Próximamente';
    }

    const li = document.createElement('li');
    li.innerHTML = `<strong>${SELLO_LABELS[n]}:</strong> ${estadoTexto}`;
    lista.appendChild(li);
  });
}

function revealPostSello({ serial, estado }) {
  const confirmacion = document.getElementById('confirmacion');
  const countdown = document.getElementById('countdown');
  const pistas = document.getElementById('pistas');
  const confSerialEl = document.getElementById('confSerial');

  if (confSerialEl) confSerialEl.textContent = serial;
  renderEstadoSellos(estado);

  if (confirmacion) confirmacion.hidden = false;
  if (countdown) countdown.hidden = false;
  if (pistas) pistas.hidden = false;

  const navDot = document.getElementById('navDotConfirmacion');
  if (navDot) navDot.hidden = false;

  if (confirmacion) {
    requestAnimationFrame(() => confirmacion.classList.add('is-visible'));
    confirmacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  stopCountdown = initCountdown((diffMs) => renderClues(diffMs));
}

initPassportForm({
  onSealed: revealPostSello,
  onYaRegistrado: (estado) => {
    const manifiesto = document.getElementById('manifiesto');
    if (manifiesto) manifiesto.style.display = 'none';
    document.body.dataset.state = 'sellado';
    revealPostSello({ serial: estado.codigo, estado });
  },
});

window.addEventListener('beforeunload', () => {
  if (stopCountdown) stopCountdown();
});
