import { initReveal, initScrollCue, initTopbar, initHeroParallax, initSlideNav } from './reveal.js';
import { initPassportForm } from './passport.js';
import { initCountdown } from './countdown.js';
import { renderClues } from './clues.js';
import { initWelcome } from './welcome.js';
import { initMotion, iniciarEntradaTapa } from './motion.js';
import { initAmbiente, mostrarAmbiente, initSonidosInterfaz } from './ambiente.js';
import { initEsquinaInvitacion } from './esquina-invitacion.js';
import { initAgregarCalendario } from './calendario.js';

// El movimiento se prepara antes que nada (parte las letras del título,
// engancha parallax y ondas) y la coreografía de la tapa arranca recién
// cuando la bienvenida termina de disiparse.
initMotion();
initAmbiente();
initSonidosInterfaz();
initWelcome({
  onDismissed: ({ conSonido } = {}) => {
    iniciarEntradaTapa();
    mostrarAmbiente({ encender: conSonido });
  },
});
initReveal();
initScrollCue();
initTopbar();
initHeroParallax();
initSlideNav();
initEsquinaInvitacion();
initAgregarCalendario();

let stopCountdown = null;

function revealPostSello({ serial, asistente }) {
  const confirmacion = document.getElementById('confirmacion');
  const countdown = document.getElementById('countdown');
  const pistas = document.getElementById('pistas');
  const confSerialEl = document.getElementById('confSerial');
  const confCorreoEl = document.getElementById('confCorreo');

  if (confSerialEl) confSerialEl.textContent = serial;
  if (confCorreoEl) confCorreoEl.textContent = asistente?.correo || '';

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

initPassportForm({ onSealed: revealPostSello });

window.addEventListener('beforeunload', () => {
  if (stopCountdown) stopCountdown();
});
