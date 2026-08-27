import { initReveal, initScrollCue, initTopbar, initHeroParallax, initSlideNav } from './reveal.js';
import { initPassportForm } from './passport.js';
import { initCountdown } from './countdown.js';
import { renderClues } from './clues.js';
import { initWelcome } from './welcome.js';
import { initMotion, iniciarEntradaTapa } from './motion.js';
import { initAmbiente, mostrarAmbiente, initSonidosInterfaz, sonidoNotificacion } from './ambiente.js';
import { initRastroArena } from './rastro-arena.js';
import { initEsquinaInvitacion } from './esquina-invitacion.js';
import { initCompasReal } from './compas.js';
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
initRastroArena();
initEsquinaInvitacion();
initCompasReal();
initAgregarCalendario();

let stopCountdown = null;

// Segundos que tarda en "llegar" el aviso de cuenta regresiva despues del
// sellado. Si aparece en el mismo instante que la confirmacion, se lee
// como una sola pantalla de golpe; llegando unos segundos despues se
// siente lo que es -- una notificacion real, separada del sellado.
const RETRASO_AVISO_CUENTA_REGRESIVA_MS = 2600;

function revealPostSello({ serial, asistente }) {
  const confirmacion = document.getElementById('confirmacion');
  const countdown = document.getElementById('countdown');
  const confSerialEl = document.getElementById('confSerial');
  const confCorreoEl = document.getElementById('confCorreo');

  if (confSerialEl) confSerialEl.textContent = serial;
  if (confCorreoEl) confCorreoEl.textContent = asistente?.correo || '';

  if (confirmacion) confirmacion.hidden = false;
  // La sección de pistas ("#pistas") queda oculta por pedido del cliente
  // hasta que las 3 pistas tengan contenido real -- por ahora las 3
  // mostraban "SELLADA" de relleno. El elemento y clues.js quedan
  // intactos en el HTML/JS para cuando se retome, simplemente no se
  // revela acá.

  const navDot = document.getElementById('navDotConfirmacion');
  if (navDot) navDot.hidden = false;

  if (confirmacion) {
    requestAnimationFrame(() => confirmacion.classList.add('is-visible'));
    confirmacion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  setTimeout(() => {
    if (countdown) countdown.hidden = false;
    sonidoNotificacion();
    stopCountdown = initCountdown((diffMs) => renderClues(diffMs));
  }, RETRASO_AVISO_CUENTA_REGRESIVA_MS);
}

initPassportForm({ onSealed: revealPostSello });

window.addEventListener('beforeunload', () => {
  if (stopCountdown) stopCountdown();
});
