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

  document.getElementById('confSerial').textContent = serial;

  confirmacion.hidden = false;
  countdown.hidden = false;
  pistas.hidden = false;

  const navDot = document.getElementById('navDotConfirmacion');
  if (navDot) navDot.hidden = false;

  requestAnimationFrame(() => confirmacion.classList.add('is-visible'));

  stopCountdown = initCountdown((diffMs) => renderClues(diffMs));

  confirmacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

initPassportForm({
  onSealed: revealPostSello,
});

window.addEventListener('beforeunload', () => {
  if (stopCountdown) stopCountdown();
});
