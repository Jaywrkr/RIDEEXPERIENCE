import { initReveal, initScrollCue, initTopbar, initHeroParallax } from './reveal.js';
import { initPassportForm } from './passport.js';
import { initCountdown } from './countdown.js';
import { renderClues } from './clues.js';

initReveal();
initScrollCue();
initTopbar();
initHeroParallax();

let stopCountdown = null;

function revealPostSello(tierLabel) {
  const confirmacion = document.getElementById('confirmacion');
  const countdown = document.getElementById('countdown');
  const pistas = document.getElementById('pistas');

  document.getElementById('confTier').textContent = tierLabel;

  confirmacion.hidden = false;
  countdown.hidden = false;
  pistas.hidden = false;

  requestAnimationFrame(() => confirmacion.classList.add('is-visible'));

  stopCountdown = initCountdown((diffMs) => renderClues(diffMs));

  confirmacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

initPassportForm({
  onSealed: ({ tierLabel }) => revealPostSello(tierLabel),
});

window.addEventListener('beforeunload', () => {
  if (stopCountdown) stopCountdown();
});
