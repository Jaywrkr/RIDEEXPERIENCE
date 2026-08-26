// Inclinar el pasaporte con el giroscopio del telefono, no solo con el
// mouse. En desktop, moverlo con el cursor ya simula sostener el objeto;
// en movil (donde se abre casi todo el trafico real, viniendo de un QR)
// el mousemove nunca dispara y ese efecto quedaba muerto. Este modulo lo
// enciende con el sensor de orientacion real.

let permisoSolicitado = false;

// iOS 13+ exige que el permiso del sensor se pida dentro de un gesto del
// usuario. Se llama desde el clic de "Entrar" de la bienvenida, que ya es
// ese gesto, para no sumar un boton nuevo solo para esto. Android y el
// resto de navegadores no tienen este permiso: la funcion no existe y se
// sigue de largo.
export async function solicitarPermisoOrientacion() {
  if (permisoSolicitado) return;
  permisoSolicitado = true;

  const solicitar = window.DeviceOrientationEvent?.requestPermission;
  if (typeof solicitar !== 'function') return;

  try {
    await solicitar();
  } catch {
    // Si el usuario lo niega, el pasaporte simplemente no se inclina solo
    // -- no es un error del flujo, solo queda sin este detalle.
  }
}

/**
 * Engancha el giroscopio a un callback que recibe (px, py) en el mismo
 * rango -0.5..0.5 que ya usa el tilt por mouse, para poder alimentar la
 * misma logica de rotacion con cualquiera de las dos fuentes.
 *
 * Se calibra contra la primera lectura en vez de usar el angulo
 * absoluto: sin eso, la inclinacion de reposo de cada quien sosteniendo
 * el telefono (mas o menos vertical, de una forma u otra) se leeria como
 * "ya esta inclinado" en vez de partir de cero.
 */
export function initTiltGiroscopio(onTilt) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  if (typeof window.DeviceOrientationEvent === 'undefined') return () => {};

  const RANGO_GRADOS = 18; // cuanto hay que inclinar el telefono para llegar al tope del efecto
  let base = null;

  function manejar(event) {
    if (event.beta === null || event.gamma === null) return;
    if (!base) {
      base = { beta: event.beta, gamma: event.gamma };
      return;
    }
    const dBeta = event.beta - base.beta;
    const dGamma = event.gamma - base.gamma;
    const py = Math.max(-0.5, Math.min(0.5, dBeta / (RANGO_GRADOS * 2)));
    const px = Math.max(-0.5, Math.min(0.5, dGamma / (RANGO_GRADOS * 2)));
    onTilt(px, py);
  }

  window.addEventListener('deviceorientation', manejar);
  return () => window.removeEventListener('deviceorientation', manejar);
}
