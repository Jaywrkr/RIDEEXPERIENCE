import { initValidacion } from './validacion.js';
import { golpeDeSello, sonidoPagina, sonidoError, sonidoTecla } from './ambiente.js';
import { trackEvent } from './analytics.js';
import { initTiltGiroscopio } from './orientacion.js';
import { EVENT_END_DATE } from './countdown.js';

const TOTAL_STEPS = 3;

// Placeholder mientras se llena el pasaporte: el número real (ATT-1001,
// ATT-1002...) lo asigna el backend en orden de registro recién al
// sellar, así que hasta ese momento esto es puramente narrativo -- se
// reemplaza por el definitivo apenas responde el servidor (ver el submit
// más abajo). Se muestra siempre el mismo "ATT-1001" (el primero de la
// serie) en vez de un número al azar, para no dar la impresión de que ya
// se asignó un número real distinto al que le va a tocar.
function generateSerial() {
  return 'ATT-1001';
}

// Arma una línea estilo MRZ (zona de lectura mecánica de un pasaporte real)
// a partir del nombre completo, puramente decorativa.
function generateMrz({ nombre, serial }) {
  const clean = (s) =>
    s
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z ]/g, '')
      .trim()
      .replace(/\s+/g, '<');

  const partes = (nombre || '').trim().split(/\s+/);
  const surname = clean(partes[0] || '') || 'DESCONOCIDO';
  const given = clean(partes.slice(1).join(' ')) || 'TITULAR';
  const nameField = `${surname}<<${given}`.slice(0, 31).padEnd(31, '<');
  const line1 = `P<TAN${nameField}`.slice(0, 36);

  const serialDigits = serial.replace(/\D/g, '').padEnd(9, '0').slice(0, 9);
  const line2 = `${serialDigits}ECU2609258STD<<<<<<<<<<<<<<`.slice(0, 36);

  return `${line1}\n${line2}`;
}

// Un contador de llamadas evita que dos ejecuciones superpuestas (si se
// vuelve a llegar al paso 3 mientras la anterior todavia estaba
// escribiendo) sigan escribiendo sobre el mismo elemento a la vez.
let mrzToken = 0;

// El MRZ aparece caracter por caracter, como si se estuviera imprimiendo
// en el momento -- en vez de aparecer entero, que se lee como texto que
// ya estaba ahi. Con reduced-motion va directo al texto completo.
function escribirMrz(el, texto) {
  if (!el) return;
  const token = ++mrzToken;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = texto;
    return;
  }

  el.textContent = '';
  let i = 0;
  function siguiente() {
    if (token !== mrzToken) return; // una escritura mas nueva la reemplazo
    if (i >= texto.length) return;
    el.textContent += texto[i];
    if (i % 3 === 0 && texto[i] !== '\n') sonidoTecla();
    i += 1;
    setTimeout(siguiente, 12 + Math.random() * 10);
  }
  siguiente();
}

// La validacion del paso 2 vive en validacion.js: antes aqui solo se
// comprobaba que los campos no estuvieran vacios, asi que un error de
// formato no aparecia hasta el paso 3, al pulsar el boton final, y sin
// decir cual de los campos fallaba.

// Guarda un borrador de los datos del titular para que un refresh a mitad
// del formulario no borre lo ya escrito. sessionStorage puede no estar
// disponible (modo privado de Safari, políticas de cookies, etc.): si
// falla, el pasaporte sigue funcionando, simplemente sin recordar nada.
const DRAFT_KEY = 'atr-passport-draft';
// Los tres campos del formulario.
const DRAFT_FIELDS = ['nombre', 'telefono', 'email'];

function saveDraft(form) {
  try {
    const draft = {};
    DRAFT_FIELDS.forEach((name) => {
      const input = form.elements[name];
      if (input) draft[name] = input.value;
    });
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Almacenamiento no disponible: se ignora, no es crítico para el flujo.
  }
}

function restoreDraft(form) {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    DRAFT_FIELDS.forEach((name) => {
      const input = form.elements[name];
      if (input && typeof draft[name] === 'string') input.value = draft[name];
    });
  } catch {
    // Borrador corrupto o storage no disponible: se arranca en blanco.
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // No hay nada que limpiar si el storage no está disponible.
  }
}

// Dispersa el pasaporte en partículas de arena que el viento se lleva.
// Se omite si el usuario prefiere movimiento reducido: el cierre narrativo
// pasa a ser puramente el fundido CSS (.is-dissolving), sin partículas.
function runDustDissolve(cardEl, canvas) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !cardEl || !canvas || !canvas.getContext || !canvas.parentElement) {
    return Promise.resolve();
  }

  const rect = cardEl.getBoundingClientRect();
  const parentRect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = parentRect.width * dpr;
  canvas.height = parentRect.height * dpr;
  canvas.style.width = `${parentRect.width}px`;
  canvas.style.height = `${parentRect.height}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const originX = rect.left - parentRect.left + rect.width / 2;
  const originY = rect.top - parentRect.top + rect.height / 2;

  const colors = ['#d3ac66', '#e4cb98', '#c41e1e'];
  const particles = Array.from({ length: 140 }, () => ({
    x: originX + (Math.random() - 0.5) * rect.width,
    y: originY + (Math.random() - 0.5) * rect.height,
    vx: (Math.random() - 0.3) * 3.2,
    vy: -Math.random() * 2 - 0.4,
    size: Math.random() * 3 + 1,
    life: 1,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return new Promise((resolve) => {
    function frame() {
      ctx.clearRect(0, 0, parentRect.width, parentRect.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.01;
        p.life -= 0.012;
        if (p.life > 0) {
          alive = true;
          ctx.globalAlpha = Math.max(p.life, 0);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      });
      if (alive) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, parentRect.width, parentRect.height);
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

// Inclina el pasaporte entero siguiendo el cursor, como un objeto físico que
// se puede tomar entre las manos — en cualquiera de sus hojas, no solo la
// portada. Se omite con reduced-motion.
function initBookTilt(frame) {
  if (!frame) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX_TILT = 7;
  const sheen = document.getElementById('pasaporteSheen');

  function aplicarTilt(px, py) {
    frame.style.transform = `rotateX(${(-py * MAX_TILT).toFixed(2)}deg) rotateY(${(px * MAX_TILT).toFixed(2)}deg)`;
    if (sheen) {
      sheen.style.setProperty('--sheen-x', `${((px + 0.5) * 100).toFixed(1)}%`);
      sheen.style.setProperty('--sheen-y', `${((py + 0.5) * 100).toFixed(1)}%`);
    }
  }

  frame.addEventListener('mousemove', (event) => {
    const rect = frame.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    aplicarTilt(px, py);
  });

  frame.addEventListener('mouseleave', () => {
    frame.style.transform = '';
  });

  // En movil no hay mousemove: el mismo tilt lo maneja el giroscopio,
  // como si el pasaporte fuera un objeto real que se puede inclinar.
  initTiltGiroscopio(aplicarTilt);
}

const STEP_CAPTIONS = {
  1: 'Comienza la aventura hacia tu destino.',
  2: '',
  3: 'Revisa tus datos antes de sellar, estas a nada de vivir la experiencia A TODO TERRENO.',
};

// Dibuja barras de código de barras pseudoaleatorias pero estables para este
// número de serie, puramente decorativas (no codifican datos reales).
function renderBarcode(container, serial) {
  if (!container) return;
  const seed = serial.replace(/\D/g, '') || '0';
  let x = 2;
  let bars = '';
  for (let i = 0; i < 46 && x < 158; i += 1) {
    const digit = Number(seed[i % seed.length]);
    const width = 1 + (digit % 3);
    if (digit % 2 === 0) {
      bars += `<rect x="${x}" y="0" width="${width}" height="34"/>`;
    }
    x += width + 1;
  }
  container.innerHTML = bars;
}

const FECHA_FMT = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' });

function formatFecha(date) {
  return FECHA_FMT.format(date).replace('.', '').toUpperCase();
}

export function initPassportForm({ onSealed }) {
  const form = document.getElementById('passportForm');
  const card = document.getElementById('manifiestoCard');
  const canvas = document.getElementById('dustCanvas');
  const serialEl = document.getElementById('passportSerial');
  const progressEl = document.querySelector('.pasaporte__progress');
  const stepLabel = document.getElementById('pasoLabel');
  const stepDots = Array.from(document.querySelectorAll('.step-dot'));
  const panels = Array.from(document.querySelectorAll('[data-step-panel]'));
  const caption = document.getElementById('pasoCaption');
  const navPrev = document.getElementById('navPrev');
  const navNext = document.getElementById('navNext');
  // Sin estos tres elementos el stepper no puede avanzar de forma segura:
  // mejor no arrancar nada a que reviente a mitad de una interacción.
  if (!form || !navPrev || !navNext) return;

  const validacion = initValidacion(form);

  restoreDraft(form);
  DRAFT_FIELDS.forEach((name) => {
    const input = form.elements[name];
    if (input) input.addEventListener('input', () => saveDraft(form));
  });

  const serial = generateSerial();
  if (serialEl) serialEl.textContent = serial;

  const barcodeSerialEl = document.getElementById('barcodeSerial');
  if (barcodeSerialEl) barcodeSerialEl.textContent = serial;
  renderBarcode(document.getElementById('barcodeBars'), serial);

  const fechaEmisionEl = document.getElementById('fechaEmision');
  if (fechaEmisionEl) fechaEmisionEl.textContent = formatFecha(new Date());
  const fechaExpiracionEl = document.getElementById('fechaExpiracion');
  // Expira cuando cierra el convoy (27 de septiembre), no cuando arranca:
  // se importa de countdown.js (fuente unica) en vez de escribirla aqui.
  if (fechaExpiracionEl) fechaExpiracionEl.textContent = formatFecha(EVENT_END_DATE);

  initBookTilt(document.querySelector('.pasaporte__pageframe'));

  let currentStep = 1;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FLIP_MS = 500;

  function updateChrome(n) {
    stepDots.forEach((dot) => {
      const dotStep = Number(dot.dataset.stepDot);
      dot.classList.toggle('is-active', dotStep === n);
      dot.classList.toggle('is-done', dotStep < n);
    });
    if (stepLabel) stepLabel.textContent = `PASO ${n} DE ${TOTAL_STEPS}`;
    if (progressEl) progressEl.setAttribute('aria-valuenow', String(n));
    if (caption) {
      const text = STEP_CAPTIONS[n] || '';
      caption.textContent = text;
      caption.hidden = !text;
    }

    navPrev.hidden = n === 1;
    // En la portada el registro se abre con el botón de la propia tapa;
    // en la última página manda el botón de sellar.
    navNext.hidden = n === 1 || n === TOTAL_STEPS;

    if (n === TOTAL_STEPS) {
      const nombre = (form.elements['nombre'] || {}).value?.trim() || '';
      const correo = (form.elements['email'] || {}).value?.trim() || '';
      const telefono = (form.elements['telefono'] || {}).value?.trim() || '';
      const asignar = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor || '—';
      };
      asignar('resumenNombre', nombre);
      asignar('resumenCorreo', correo);
      asignar('resumenTelefono', telefono);
      asignar('resumenSerial', serial);
      const mrzEl = document.getElementById('pasaporteMrz');
      escribirMrz(mrzEl, generateMrz({ nombre, serial }));
    }
  }

  function focusPanel(panel) {
    const firstInput = panel && panel.querySelector('input:not([type="radio"]), input[type="radio"]:checked');
    if (firstInput) firstInput.focus({ preventScroll: true });
  }

  // Cambia de página como si se hojeara un pasaporte real: la página saliente
  // gira sobre el lomo hacia adentro mientras la entrante gira hacia afuera,
  // sincronizadas para que nunca se vea el reverso de ninguna (backface-visibility).
  function showStep(n) {
    const oldPanel = panels.find((p) => Number(p.dataset.stepPanel) === currentStep);
    const newPanel = panels.find((p) => Number(p.dataset.stepPanel) === n);
    const forward = n > currentStep;
    currentStep = n;
    updateChrome(n);

    sonidoPagina();

    if (!oldPanel || oldPanel === newPanel || reduceMotion || !newPanel.animate) {
      panels.forEach((panel) => { panel.hidden = panel !== newPanel; });
      focusPanel(newPanel);
      return;
    }

    const sign = forward ? 1 : -1;
    newPanel.hidden = false;
    oldPanel.style.zIndex = '2';
    newPanel.style.zIndex = '1';

    oldPanel.animate(
      [{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${-sign * 130}deg)` }],
      { duration: FLIP_MS, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }
    ).onfinish = () => {
      oldPanel.hidden = true;
      oldPanel.style.transform = '';
      oldPanel.style.zIndex = '';
    };

    newPanel.animate(
      [{ transform: `rotateY(${sign * 130}deg)` }, { transform: 'rotateY(0deg)' }],
      { duration: FLIP_MS, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }
    ).onfinish = () => {
      newPanel.style.transform = '';
      newPanel.style.zIndex = '';
      focusPanel(newPanel);
    };
  }

  const consentimientoInput = form.elements['consentimiento'];
  const errConsentimiento = document.getElementById('err-consentimiento');

  function validarConsentimiento() {
    if (!consentimientoInput) return true;
    const ok = consentimientoInput.checked;
    consentimientoInput.closest('.field--consentimiento')?.classList.toggle('invalid', !ok);
    if (errConsentimiento) {
      errConsentimiento.textContent = ok ? '' : 'Para continuar necesitamos tu autorización para usar estos datos.';
    }
    return ok;
  }

  if (consentimientoInput) {
    consentimientoInput.addEventListener('change', validarConsentimiento);
  }

  function goNext() {
    if (currentStep === 2 && !validacion.validarTodo()) return;
    if (currentStep === 2 && !validarConsentimiento()) return;
    if (currentStep === 2) trackEvent('datos_completados');
    if (currentStep < TOTAL_STEPS) showStep(currentStep + 1);
  }

  navNext.addEventListener('click', goNext);
  navPrev.addEventListener('click', () => {
    if (currentStep > 1) showStep(currentStep - 1);
  });

  // La portada abre directo a la pagina de datos: no hay codigo previo
  // que validar, el registro es abierto.
  const coverCta = document.getElementById('coverCta');
  if (coverCta) {
    coverCta.addEventListener('click', () => {
      if (currentStep === 1) {
        trackEvent('registro_iniciado');
        showStep(2);
      }
    });
  }

  let sealing = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (currentStep !== TOTAL_STEPS || sealing) return;

    const datos = {
      nombre: (form.elements['nombre']?.value || '').trim(),
      correo: (form.elements['email']?.value || '').trim(),
      telefono: (form.elements['telefono']?.value || '').trim(),
    };

    const sellarBtn = form.querySelector('.btn-sellar');
    const sellarTexto = document.getElementById('btnSellarTexto');
    const errorEl = document.getElementById('err-sellar');
    const textoOriginal = sellarTexto ? sellarTexto.textContent : '';

    // Entre este click y la respuesta del servidor puede pasar mas de un
    // instante: disabled bloquea un segundo tap, y el spinner + "Sellando..."
    // le confirman a la persona que el primero si se registro.
    if (sellarBtn) {
      sellarBtn.disabled = true;
      sellarBtn.classList.add('is-loading');
    }
    if (sellarTexto) sellarTexto.textContent = 'Sellando...';
    if (errorEl) errorEl.textContent = '';

    let asistente;
    try {
      const eventoId = await Api.obtenerEventoId();
      asistente = await Api.registrar(eventoId, datos);
    } catch (error) {
      if (errorEl) errorEl.textContent = error.message || 'No pudimos registrar tu pasaporte. Intenta de nuevo.';
      if (sellarBtn) {
        sellarBtn.disabled = false;
        sellarBtn.classList.remove('is-loading');
      }
      if (sellarTexto) sellarTexto.textContent = textoOriginal;
      sonidoError();
      return;
    }

    // El numero de pasaporte real es secuencial y lo asigna el backend
    // recien al registrar (ATT-1001, ATT-1002...); el que se mostraba
    // hasta este punto era un decorativo de sesion. Si el backend todavia
    // no manda "codigo" (despliegue viejo), se conserva el decorativo en
    // vez de romper la pantalla de confirmacion.
    const serialFinal = asistente?.codigo || serial;
    if (serialEl) serialEl.textContent = serialFinal;
    if (barcodeSerialEl) barcodeSerialEl.textContent = serialFinal;
    renderBarcode(document.getElementById('barcodeBars'), serialFinal);
    const resumenSerialEl = document.getElementById('resumenSerial');
    if (resumenSerialEl) resumenSerialEl.textContent = serialFinal;

    trackEvent('registro_sellado');
    sealing = true;
    document.body.dataset.state = 'sellando';

    // El sello cae sobre el papel como tinta; el pasaporte se sacude al impacto
    // y se deja ver la marca antes de que el documento se disuelva.
    const stamp = document.getElementById('selloStamp');
    if (stamp) stamp.classList.add('is-landed');
    if (card) setTimeout(() => card.classList.add('is-stamped'), 250);
    golpeDeSello();

    await new Promise((r) => setTimeout(r, reduceMotion ? 400 : 1600));

    if (card) card.classList.add('is-dissolving');
    await runDustDissolve(card, canvas);

    const manifiestoEl = document.getElementById('manifiesto');
    if (manifiestoEl) manifiestoEl.style.display = 'none';
    document.body.dataset.state = 'sellado';
    clearDraft();

    if (typeof onSealed === 'function') {
      onSealed({ serial: serialFinal, asistente });
    }
  });

  updateChrome(1);
}
