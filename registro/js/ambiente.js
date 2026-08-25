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

  ruido.start();
  lfoTono.start();
  lfoRafaga.start();
  fuentes = [ruido, lfoTono, lfoRafaga];
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

/**
 * Muestra el control. Se llama al cerrarse la bienvenida y no antes: el
 * overlay de bienvenida está por encima y se cierra al hacer clic en
 * cualquier parte, así que un botón debajo sería inalcanzable, y uno por
 * encima cerraría la bienvenida sin querer al intentar usarlo.
 */
export function mostrarAmbiente() {
  const boton = document.getElementById('ambienteToggle');
  if (!boton || !(window.AudioContext || window.webkitAudioContext)) return;
  boton.hidden = false;
}
