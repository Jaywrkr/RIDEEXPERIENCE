// Si nadie toca la tapa, la esquina inferior derecha se despega sola un
// instante y vuelve a su lugar -- el gesto universal de "esto se puede
// tocar", sin decir una palabra ni tapar nada con un texto de ayuda.
export function initEsquinaInvitacion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cover = document.getElementById('pasaporteCover');
  const esquina = document.getElementById('coverEsquina');
  if (!cover || !esquina) return;

  const ESPERA_MS = 4000;
  const MAX_INVITACIONES = 3; // despues de tres intentos sin respuesta, se deja de insistir
  let conteo = 0;
  let timer = null;

  function disparar() {
    esquina.classList.remove('is-inviting');
    // Fuerza un reflow para poder reiniciar la misma animación por CSS.
    void esquina.offsetWidth;
    esquina.classList.add('is-inviting');
    conteo += 1;
    programar();
  }

  function programar() {
    clearTimeout(timer);
    // La tapa ya se dejo atras (se avanzo de paso) o ya se insistio
    // suficiente: no programar mas.
    if (cover.hidden || conteo >= MAX_INVITACIONES) return;
    timer = setTimeout(disparar, ESPERA_MS);
  }

  cover.addEventListener('pointerdown', programar, { passive: true });
  cover.addEventListener('keydown', programar);

  programar();
}
