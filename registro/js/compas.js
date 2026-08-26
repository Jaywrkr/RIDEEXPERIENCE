// La rosa de los vientos del pie de la hoja de datos era puramente
// decorativa. Esto la conecta al sensor de orientacion real del
// telefono: la aguja apunta al norte de verdad, como una brujula.
//
// Aviso honesto: esto es un detalle de sorpresa, no un instrumento de
// navegacion. La lectura de "norte" que dan los navegadores (sobre todo
// en Android, con deviceorientationabsolute) puede estar descalibrada
// varios grados segun el telefono. No pasa nada si no es exacta: el
// efecto que se busca es "esto reacciona de verdad", no precision.
export function initCompasReal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const aguja = document.getElementById('compassAguja');
  const coverCta = document.getElementById('coverCta');
  if (!aguja) return;

  let enganchado = false;

  function rumbo(gradosDesdeElNorte) {
    // La aguja esta dibujada apuntando "arriba" (norte) en reposo. Si el
    // telefono gira `gradosDesdeElNorte` en sentido horario, el norte
    // real se desplaza esa misma cantidad en sentido antihorario dentro
    // del marco de referencia de la pantalla -- por eso el signo negativo.
    aguja.style.transform = `rotate(${-gradosDesdeElNorte}deg)`;
  }

  function alEvento(event) {
    // iOS: webkitCompassHeading ya viene como rumbo de brujula (0 = norte),
    // sin necesidad de invertir signo ni de "absolute".
    if (typeof event.webkitCompassHeading === 'number') {
      rumbo(event.webkitCompassHeading);
      return;
    }
    // Android / resto: alpha es la rotacion en Z. Con absolute:true suele
    // venir como grados a favor de las agujas del reloj desde el norte
    // magnetico -- de ahi el mismo signo que arriba.
    if (event.absolute && typeof event.alpha === 'number') {
      rumbo(event.alpha);
    }
  }

  function engancharSensor() {
    if (enganchado) return;
    enganchado = true;
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', alEvento);
    } else {
      window.addEventListener('deviceorientation', alEvento);
    }
  }

  // iOS 13+ exige permiso dentro de un gesto del usuario. El clic en
  // "Registrate aqui" es el gesto natural mas cercano a donde vive la
  // brujula (la hoja de datos, un paso despues).
  async function pedirPermisoYEnganchar() {
    const solicitar = window.DeviceOrientationEvent?.requestPermission;
    if (typeof solicitar !== 'function') {
      engancharSensor();
      return;
    }
    try {
      const resultado = await solicitar();
      if (resultado === 'granted') engancharSensor();
    } catch {
      // Sin permiso, la brujula se queda quieta -- no rompe nada mas.
    }
  }

  coverCta?.addEventListener('click', pedirPermisoYEnganchar, { once: true });
}
