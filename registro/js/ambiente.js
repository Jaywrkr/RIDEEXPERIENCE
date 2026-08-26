// Viento de desierto sintetizado con Web Audio. No carga ningún archivo:
// el sonido se genera en el navegador, así que pesa 0 KB y no añade una
// petición de red al cargar la página.
//
// Cómo suena: ruido marrón (más grave y menos siseante que el blanco)
// filtrado por una banda estrecha que se pasea lentamente de frecuencia,
// más ráfagas de volumen a otro ritmo. Esa combinación de dos ciclos con
// periodos distintos es lo que evita que se oiga como un bucle.
//
// Arranca SIEMPRE en silencio. Los navegadores bloquean el audio
// automático, pero además, para una marca, sonido sin pedir permiso se
// siente barato: lo enciende la persona si quiere.

const CLAVE = 'atr-ambiente';
// Calibrado midiendo la señal renderizada: con 0.055 el pico quedaba en
// -32 dB, inaudible en parlantes de laptop. Con 0.19 el pico ronda -21 dB,
// que es presencia de fondo sin tapar nada.
const VOLUMEN = 0.19;
const FUNDIDO = 1.8;        // segundos de entrada/salida

let ctx = null;
let master = null;
let fuentes = [];
let sonando = false;

function crearRuidoMarron(contexto, segundos = 4) {
  const n = contexto.sampleRate * segundos;
  const buffer = contexto.createBuffer(1, n, contexto.sampleRate);
  const datos = buffer.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < n; i += 1) {
    const blanco = Math.random() * 2 - 1;
    // Integrar el ruido blanco lo vuelve marrón: cae 6 dB por octava,
    // que es el perfil del viento real (grave, sin siseo agudo).
    ultimo = (ultimo + 0.02 * blanco) / 1.02;
    datos[i] = ultimo * 3.5;
  }
  // Se suaviza la unión final con la inicial para que el bucle no chasque.
  const cruce = Math.floor(contexto.sampleRate * 0.25);
  for (let i = 0; i < cruce; i += 1) {
    const t = i / cruce;
    datos[n - cruce + i] = datos[n - cruce + i] * (1 - t) + datos[i] * t;
  }
  return buffer;
}

function construir() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return false;

  ctx = new Ctx();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const ruido = ctx.createBufferSource();
  ruido.buffer = crearRuidoMarron(ctx);
  ruido.loop = true;

  // Banda estrecha que barre: es lo que convierte un siseo plano en algo
  // que "sopla".
  const banda = ctx.createBiquadFilter();
  banda.type = 'bandpass';
  banda.frequency.value = 420;
  banda.Q.value = 0.7;

  // Corta los agudos que harían sonar el ruido a estática de radio.
  const techo = ctx.createBiquadFilter();
  techo.type = 'lowpass';
  techo.frequency.value = 1100;

  // Ciclo 1: la frecuencia de la banda sube y baja cada ~19 s.
  const lfoTono = ctx.createOscillator();
  lfoTono.frequency.value = 1 / 19;
  const profTono = ctx.createGain();
  profTono.gain.value = 260;
  lfoTono.connect(profTono).connect(banda.frequency);

  // Ciclo 2: ráfagas de volumen cada ~13 s. Periodos distintos y no
  // múltiplos entre sí, para que la combinación no se repita al oído.
  const rafaga = ctx.createGain();
  rafaga.gain.value = 0.62;
  const lfoRafaga = ctx.createOscillator();
  lfoRafaga.frequency.value = 1 / 13;
  const profRafaga = ctx.createGain();
  profRafaga.gain.value = 0.34;
  lfoRafaga.connect(profRafaga).connect(rafaga.gain);

  ruido.connect(banda).connect(techo).connect(rafaga).connect(master);

  // ---- Segunda capa: silbido alto y lejano ----
  // Una sola banda da un viento plano. Esta segunda voz, mucho mas aguda
  // y mucho mas suave, es la que aporta la sensacion de distancia: en el
  // viento real las frecuencias altas llegan de mas lejos y con otro
  // ritmo que las graves.
  const silbido = ctx.createBufferSource();
  silbido.buffer = crearRuidoMarron(ctx, 5);
  silbido.loop = true;

  const bandaAlta = ctx.createBiquadFilter();
  bandaAlta.type = 'bandpass';
  bandaAlta.frequency.value = 1400;
  bandaAlta.Q.value = 3.2;

  const lfoAlta = ctx.createOscillator();
  lfoAlta.frequency.value = 1 / 31;       // periodo primo respecto a los otros
  const profAlta = ctx.createGain();
  profAlta.gain.value = 520;
  lfoAlta.connect(profAlta).connect(bandaAlta.frequency);

  const gSilbido = ctx.createGain();
  gSilbido.gain.value = 0.16;
  const lfoSilbido = ctx.createOscillator();
  lfoSilbido.frequency.value = 1 / 23;
  const profSilbido = ctx.createGain();
  profSilbido.gain.value = 0.13;
  lfoSilbido.connect(profSilbido).connect(gSilbido.gain);

  silbido.connect(bandaAlta).connect(gSilbido).connect(master);

  // ---- Tercera capa: roce de arena ----
  // Un siseo muy tenue en la zona media-alta. Es lo que separa "viento"
  // de "viento sobre arena": el grano arrastrandose.
  const arena = ctx.createBufferSource();
  arena.buffer = crearRuidoMarron(ctx, 3);
  arena.loop = true;
  arena.playbackRate.value = 2.6;   // acelera el ruido: lo vuelve mas granular

  const filtroArena = ctx.createBiquadFilter();
  filtroArena.type = 'highpass';
  filtroArena.frequency.value = 900;

  const gArena = ctx.createGain();
  gArena.gain.value = 0.09;
  const lfoArena = ctx.createOscillator();
  lfoArena.frequency.value = 1 / 17;
  const profArena = ctx.createGain();
  profArena.gain.value = 0.07;
  lfoArena.connect(profArena).connect(gArena.gain);

  arena.connect(filtroArena).connect(gArena).connect(master);

  [ruido, lfoTono, lfoRafaga, silbido, lfoAlta, lfoSilbido, arena, lfoArena]
    .forEach((n) => n.start());
  fuentes = [ruido, lfoTono, lfoRafaga, silbido, lfoAlta, lfoSilbido, arena, lfoArena];
  return true;
}

function subir() {
  const ahora = ctx.currentTime;
  master.gain.cancelScheduledValues(ahora);
  master.gain.setValueAtTime(master.gain.value, ahora);
  master.gain.linearRampToValueAtTime(VOLUMEN, ahora + FUNDIDO);
}

function bajar() {
  const ahora = ctx.currentTime;
  master.gain.cancelScheduledValues(ahora);
  master.gain.setValueAtTime(master.gain.value, ahora);
  master.gain.linearRampToValueAtTime(0, ahora + FUNDIDO * 0.5);
}

function recordar(valor) {
  try {
    localStorage.setItem(CLAVE, valor ? '1' : '0');
  } catch {
    // Sin almacenamiento la preferencia simplemente no sobrevive a la
    // recarga; no es motivo para romper el sonido.
  }
}

function recordado() {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
}

// Se guarda la funcion de alternar para poder encender el ambiente desde
// fuera (la bienvenida ofrece "entrar con sonido", y ese clic es el unico
// permiso que el navegador acepta para reproducir audio).
let alternarExterno = null;

export function initAmbiente() {
  const boton = document.getElementById('ambienteToggle');
  if (!boton) return;

  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    // Navegador sin Web Audio: se retira el control en vez de dejar un
    // botón que no hace nada.
    boton.remove();
    return;
  }

  function pintar() {
    boton.setAttribute('aria-pressed', String(sonando));
    boton.setAttribute('aria-label', sonando ? 'Silenciar el viento' : 'Activar sonido ambiente');
    boton.classList.toggle('is-on', sonando);
  }

  async function alternar() {
    if (!ctx && !construir()) return;
    // El contexto nace suspendido hasta que hay un gesto del usuario.
    if (ctx.state === 'suspended') await ctx.resume();

    sonando = !sonando;
    if (sonando) subir();
    else bajar();
    recordar(sonando);
    pintar();
  }

  boton.addEventListener('click', alternar);
  alternarExterno = alternar;
  pintar();

  // Si ya lo había encendido antes, se respeta la preferencia — pero el
  // navegador igual exige un gesto, así que se espera al primer toque en
  // cualquier parte de la página en vez de intentar sonar de entrada.
  if (recordado()) {
    const alPrimerGesto = () => {
      if (!sonando) alternar();
    };
    document.addEventListener('pointerdown', alPrimerGesto, { once: true });
  }

  // Al irse de la pestaña el viento se calla: seguir sonando de fondo en
  // una pestaña que no se está mirando es molesto y gasta batería.
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !sonando) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  });
}

/* =====================================================================
   SONIDOS DE INTERACCIÓN
   Todos salen de la misma fábrica para que suenen como una familia y no
   como efectos sueltos pegados encima: mismo material (ruido filtrado,
   sin tonos musicales), envolventes cortas y volumen bajo. La referencia
   es el papel y la arena, no una interfaz digital.

   Ninguno suena si la persona no encendió el ambiente: un sitio que hace
   ruido sin haberlo pedido es exactamente lo que hace que se silencie la
   pestaña.
   ===================================================================== */

function puedeSonar() {
  return sonando && ctx && ctx.state === 'running';
}

/**
 * Un golpe de ruido filtrado con caída exponencial. Es el ladrillo con el
 * que se arman todos los sonidos de interfaz.
 *
 * @param {number} frecuencia  centro del filtro, en Hz
 * @param {number} duracion    en segundos
 * @param {number} volumen     0..1
 * @param {number} q           estrechez del filtro: más alto, más "tono"
 */
function pulso({ frecuencia, duracion, volumen, q = 1, tipo = 'bandpass' }) {
  const t = ctx.currentTime;
  const n = Math.max(1, Math.floor(ctx.sampleRate * duracion));
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < n; i += 1) {
    // La caída al cubo hace que el golpe sea seco: mucha energía al
    // principio y nada de cola, como algo que toca una superficie.
    datos[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
  }

  const fuente = ctx.createBufferSource();
  fuente.buffer = buffer;

  const filtro = ctx.createBiquadFilter();
  filtro.type = tipo;
  filtro.frequency.value = frecuencia;
  filtro.Q.value = q;

  const g = ctx.createGain();
  g.gain.value = volumen;

  fuente.connect(filtro).connect(g).connect(ctx.destination);
  fuente.start(t);
}

/** Roce seco al pasar por encima de algo pulsable. */
export function sonidoRoce() {
  if (!puedeSonar()) return;
  pulso({ frecuencia: 2600, duracion: 0.035, volumen: 0.026, q: 0.8, tipo: 'highpass' });
}

/** Pulsación: papel que cede. Grave y corto. */
export function sonidoPulsar() {
  if (!puedeSonar()) return;
  // Volumenes calibrados midiendo la senal renderizada. La jerarquia
  // importa: roce (hover) < pulsacion (clic) < paso de pagina. Con los
  // valores iniciales el roce sonaba MAS fuerte que el clic, porque el
  // paso alto deja pasar mucho mas que un pasabanda estrecho.
  pulso({ frecuencia: 620, duracion: 0.07, volumen: 0.3, q: 1.4 });
  pulso({ frecuencia: 1900, duracion: 0.03, volumen: 0.13, q: 1 });
}

/** Paso de página del pasaporte: barrido de papel, más largo. */
export function sonidoPagina() {
  if (!puedeSonar()) return;
  const t = ctx.currentTime;
  const dur = 0.34;
  const n = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < n; i += 1) {
    const x = i / n;
    // Entra y sale: es un roce que pasa, no un golpe.
    const sobre = Math.sin(Math.PI * x) ** 2;
    datos[i] = (Math.random() * 2 - 1) * sobre;
  }
  const fuente = ctx.createBufferSource();
  fuente.buffer = buffer;

  const filtro = ctx.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.Q.value = 0.9;
  // El barrido de frecuencia es lo que da la sensación de que la hoja
  // recorre el aire en vez de sonar en un punto fijo.
  filtro.frequency.setValueAtTime(700, t);
  filtro.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.55);
  filtro.frequency.exponentialRampToValueAtTime(900, t + dur);

  const g = ctx.createGain();
  g.gain.value = 0.13;

  fuente.connect(filtro).connect(g).connect(ctx.destination);
  fuente.start(t);
}

/** Tecla del MRZ imprimiéndose: mismo material que el roce, más seco y
 *  agudo, como el cabezal de una impresora de matriz de puntos. Se llama
 *  una vez por cada grupo de caracteres, no por cada uno: a la cadencia
 *  del efecto le sobra ritmo, no le falta. */
export function sonidoTecla() {
  if (!puedeSonar()) return;
  pulso({ frecuencia: 3400, duracion: 0.02, volumen: 0.045, q: 1.1, tipo: 'highpass' });
}

/** Aviso de error: dos golpes graves, sin nota musical. */
export function sonidoError() {
  if (!puedeSonar()) return;
  pulso({ frecuencia: 320, duracion: 0.08, volumen: 0.13, q: 2 });
  setTimeout(() => {
    if (puedeSonar()) pulso({ frecuencia: 260, duracion: 0.09, volumen: 0.11, q: 2 });
  }, 110);
}

/**
 * El golpe del sello: vibración corta en el móvil y un "tunc" grave.
 *
 * La vibración es el detalle que más suma aquí — el dispositivo principal
 * es el teléfono (se llega escaneando un QR) y sentir el sello en la mano
 * convierte un envío de formulario en un gesto físico. Es un solo pulso
 * corto, no un patrón largo: vibrar de más molesta.
 *
 * El sonido solo suena si la persona encendió el ambiente. Sonar sin que
 * lo haya pedido, aunque sea un golpe puntual, es exactamente lo que hace
 * que la gente silencie la pestaña.
 */
export function golpeDeSello() {
  try {
    navigator.vibrate?.(18);
  } catch {
    // Sin soporte de vibración no pasa nada: es un extra, no el efecto.
  }

  if (!sonando || !ctx || ctx.state !== 'running') return;

  const t = ctx.currentTime;

  // Cuerpo del golpe: una senoide grave que cae de tono, que es como
  // suena algo macizo al impactar.
  const cuerpo = ctx.createOscillator();
  cuerpo.type = 'sine';
  cuerpo.frequency.setValueAtTime(190, t);
  cuerpo.frequency.exponentialRampToValueAtTime(48, t + 0.16);

  const gCuerpo = ctx.createGain();
  gCuerpo.gain.setValueAtTime(0.0001, t);
  gCuerpo.gain.exponentialRampToValueAtTime(0.5, t + 0.008);
  gCuerpo.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

  // Chasquido de la goma contra el papel: un pulso de ruido muy corto.
  const clic = ctx.createBufferSource();
  const n = Math.floor(ctx.sampleRate * 0.05);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i += 1) {
    d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
  }
  clic.buffer = buf;

  const filtroClic = ctx.createBiquadFilter();
  filtroClic.type = 'bandpass';
  filtroClic.frequency.value = 1500;

  const gClic = ctx.createGain();
  gClic.gain.value = 0.28;

  // Sale por el destino y no por el master del viento, para que el golpe
  // no herede el nivel bajo del ambiente ni sus ráfagas.
  cuerpo.connect(gCuerpo).connect(ctx.destination);
  clic.connect(filtroClic).connect(gClic).connect(ctx.destination);

  cuerpo.start(t);
  cuerpo.stop(t + 0.3);
  clic.start(t);
}

/**
 * Muestra el control. Se llama al cerrarse la bienvenida y no antes: el
 * overlay de bienvenida está por encima y se cierra al hacer clic en
 * cualquier parte, así que un botón debajo sería inalcanzable, y uno por
 * encima cerraría la bienvenida sin querer al intentar usarlo.
 */
export function mostrarAmbiente({ encender = false } = {}) {
  const boton = document.getElementById('ambienteToggle');
  if (!boton || !(window.AudioContext || window.webkitAudioContext)) return;
  boton.hidden = false;
  // Se enciende dentro del mismo turno del gesto que cerro la bienvenida:
  // esperar mas (a un timeout, por ejemplo) haria que el navegador ya no
  // lo considere una accion del usuario y bloquee el audio.
  if (encender && !sonando) alternarExterno?.();
}


/**
 * Conecta los sonidos de interfaz a toda la página, con delegación desde
 * el documento: así cubre también lo que aparece después (los pasos del
 * pasaporte, la confirmación) sin tener que reenganchar nada.
 *
 * El roce solo se aplica con puntero fino: en táctil no hay hover, y
 * dispararlo en cada toque duplicaría el sonido de pulsación.
 */
export function initSonidosInterfaz() {
  const PULSABLES = 'button, a[href], .slide-nav a, [role="button"]';

  document.addEventListener('pointerdown', (evento) => {
    if (evento.target.closest(PULSABLES)) sonidoPulsar();
  });

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let ultimo = null;
    document.addEventListener('pointerover', (evento) => {
      const objetivo = evento.target.closest(PULSABLES);
      // Solo al ENTRAR en un elemento nuevo: sin esta guarda, moverse
      // dentro del mismo botón dispararía el roce en cada píxel.
      if (objetivo && objetivo !== ultimo) {
        ultimo = objetivo;
        sonidoRoce();
      } else if (!objetivo) {
        ultimo = null;
      }
    });
  }
}
