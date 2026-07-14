import { initReveal, initScrollCue, initTopbar, initHeroParallax, initSlideNav } from './reveal.js';
import { initPassportForm } from './passport.js';
import { initCountdown } from './countdown.js';
import { renderClues } from './clues.js';

initReveal();
initScrollCue();
initTopbar();
initHeroParallax();
initSlideNav();

let stopCountdown = null;

function revealPostSello({ serial }) {
  const confirmacion = document.getElementById('confirmacion');
  const countdown = document.getElementById('countdown');
  const pistas = document.getElementById('pistas');
  const confSerialEl = document.getElementById('confSerial');

  if (confSerialEl) confSerialEl.textContent = serial;

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
});

window.addEventListener('beforeunload', () => {
  if (stopCountdown) stopCountdown();
});
