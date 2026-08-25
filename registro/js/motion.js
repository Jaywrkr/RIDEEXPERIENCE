// Capa de movimiento de la tapa: coreografía de entrada, parallax de las
// montañas y micro-interacciones de los botones.
//
// Todo lo de aquí es decorativo: si el usuario pidió menos movimiento, o
// si algo falla, la página queda exactamente igual de usable — los
// elementos nunca dependen de estas animaciones para ser visibles (el
// CSS solo los oculta cuando la clase `js-motion` está presente, y esa
// clase la pone este módulo).

const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Parte un texto en letras envueltas en <span> para poder escalonarlas.
 * El texto original se conserva como aria-label y las letras quedan
 * ocultas al lector de pantalla, que si no deletrearía palabra por letra.
 */
function separarLetras(el) {
  if (!el || el.dataset.split === 'listo') return;
  const texto = el.textContent;
  el.setAttribute('aria-label', texto);
  el.textContent = '';

  let indice = 0;
  for (const caracter of texto) {
    const span = document.createElement('span');
    span.className = 'ltr';
    span.setAttribute('aria-hidden', 'true');
    if (caracter === ' ') {
      span.classList.add('ltr--espacio');
      span.innerHTML = '&nbsp;';
    } else {
      span.textContent = caracter;
      span.style.setProperty('--i', indice);
      indice += 1;
    }
    el.appendChild(span);
  }
  el.dataset.split = 'listo';
}

/**
 * Dispara la entrada de la tapa. Se llama cuando la bienvenida se
 * disipa, para que la coreografía no corra detrás del overlay.
 */
export function iniciarEntradaTapa() {
  document.documentElement.classList.add('has-entered');
}

/**
 * Parallax de las tres capas de montaña siguiendo el puntero. Cada capa
 * se mueve a distinta velocidad, que es lo que produce la sensación de
 * profundidad. Se engancha al mismo marco que ya tiene el tilt 3D.
 */
function initParallaxMontanas() {
  const dunas = document.querySelector('.cover-dunes');
  const marco = document.querySelector('.pasaporte__frame') || dunas?.closest('.paso--cover');
  if (!dunas || !marco || reduceMotion()) return;

  // Puntero grueso (táctil): no hay hover que seguir, se omite.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const capas = [
    { el: dunas.querySelector('.cover-dunes__back'), factor: 14 },
    { el: dunas.querySelector('.cover-dunes__ruta'), factor: 22 },
    { el: dunas.querySelector('.cover-dunes__front'), factor: 30 },
  ].filter((c) => c.el);
  if (capas.length === 0) return;

  let pendiente = false;
  let px = 0;
  let py = 0;

  function pintar() {
    pendiente = false;
    capas.forEach(({ el, factor }) => {
      el.style.transform = `translate3d(${(px * factor).toFixed(2)}px, ${(py * factor * 0.4).toFixed(2)}px, 0)`;
    });
  }

  marco.addEventListener('mousemove', (evento) => {
    const r = marco.getBoundingClientRect();
    px = (evento.clientX - r.left) / r.width - 0.5;
    py = (evento.clientY - r.top) / r.height - 0.5;
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(pintar);
    }
  });

  marco.addEventListener('mouseleave', () => {
    capas.forEach(({ el }) => {
      el.style.transition = 'transform .7s var(--ease-salida)';
      el.style.transform = 'translate3d(0,0,0)';
      setTimeout(() => { el.style.transition = ''; }, 700);
    });
  });
}

/**
 * Onda de tinta al pulsar un botón: nace en el punto exacto del clic,
 * no en el centro, que es lo que hace que se sienta física.
 */
function initOndaBotones() {
  if (reduceMotion()) return;

  document.addEventListener('pointerdown', (evento) => {
    const boton = evento.target.closest('.cover-cta, .btn-paso, .btn-sellar, .welcome__cta');
    if (!boton) return;

    const r = boton.getBoundingClientRect();
    const onda = document.createElement('span');
    onda.className = 'onda';
    // El diámetro cubre el botón entero desde cualquier punto de origen.
    const tam = Math.max(r.width, r.height) * 2.2;
    onda.style.width = onda.style.height = `${tam}px`;
    onda.style.left = `${evento.clientX - r.left - tam / 2}px`;
    onda.style.top = `${evento.clientY - r.top - tam / 2}px`;

    boton.appendChild(onda);
    onda.addEventListener('animationend', () => onda.remove(), { once: true });
  });
}

export function initMotion() {
  // Marca que el JS de movimiento está activo. El CSS solo esconde los
  // elementos para animarlos si ve esta clase, así que sin JS todo se
  // ve normal en vez de quedar invisible.
  document.documentElement.classList.add('js-motion');

  separarLetras(document.querySelector('.cover-atodo'));
  separarLetras(document.querySelector('.cover-terreno'));

  initParallaxMontanas();
  initOndaBotones();
}
