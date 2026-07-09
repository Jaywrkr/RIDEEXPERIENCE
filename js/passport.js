const TIER_LABELS = {
  standard: 'STANDARD — Convoy',
  plus: 'PLUS — Avanzada',
  elite: 'ELITE — Cabeza de expedición',
};

const TOTAL_PAGES = 11;
const DATOS_PAGE = 6;
const SELLO_PAGE = 8;
const CONFIRM_PAGE = 9;

// Genera un número de pasaporte estable para esta sesión, con formato
// consistente con la serie de la Convención Nacional Shineray 2026.
function generateSerial() {
  const n = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, '0');
  return `AT26-${n}`;
}

// Arma una línea estilo MRZ (zona de lectura mecánica de un pasaporte real)
// a partir de los datos cargados, puramente decorativa.
function generateMrz({ nombre, serial, tier }) {
  const clean = (s) =>
    s
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z ]/g, '')
      .trim()
      .replace(/\s+/g, '<');

  const nameField = (clean(nombre) || 'TITULAR<DESCONOCIDO').slice(0, 30).padEnd(30, '<');
  const line1 = `P<TAN${nameField}`.padEnd(44, '<').slice(0, 44);

  const serialDigits = serial.replace(/\D/g, '').padEnd(9, '0').slice(0, 9);
  const tierCode = (tier || 'STD').slice(0, 3).toUpperCase();
  const line2 = `${serialDigits}ECU2609258${tierCode}<<<<<<<<<<<<<<`.slice(0, 44);

  return `${line1}\n${line2}`;
}

function validateDatos(form) {
  let ok = true;
  const required = ['nombre', 'moto', 'ciudad'];
  required.forEach((name) => {
    const input = form.elements[name];
    const errorEl = document.getElementById(`err-${name}`);
    const value = input.value.trim();
    if (!value) {
      ok = false;
      input.classList.add('invalid');
      errorEl.textContent = 'Este dato es necesario para el pasaporte.';
    } else {
      input.classList.remove('invalid');
      errorEl.textContent = '';
    }
  });
  return ok;
}

// Inclina la portada del pasaporte siguiendo el cursor, como si fuera un
// objeto físico que se puede tomar entre las manos. Se omite con reduced-motion.
function initCoverTilt(cover) {
  if (!cover) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX_TILT = 10;
  const sheen = document.getElementById('pasaporteSheen');

  cover.addEventListener('mousemove', (event) => {
    const rect = cover.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    cover.style.transform = `perspective(1000px) rotateX(${(-py * MAX_TILT).toFixed(2)}deg) rotateY(${(px * MAX_TILT).toFixed(2)}deg) scale(1.02)`;
    if (sheen) {
      sheen.style.setProperty('--sheen-x', `${((px + 0.5) * 100).toFixed(1)}%`);
      sheen.style.setProperty('--sheen-y', `${((py + 0.5) * 100).toFixed(1)}%`);
    }
  });

  cover.addEventListener('mouseleave', () => {
    cover.style.transform = '';
  });
}

export function initPassportBook({ onSealed }) {
  const form = document.getElementById('passportForm');
  const card = document.getElementById('pasaporte');
  const serialEl = document.getElementById('passportSerial');
  const progressEl = document.querySelector('.pasaporte__progress');
  const pageLabel = document.getElementById('pasoLabel');
  const progressFill = document.getElementById('progressFill');
  const pages = Array.from(document.querySelectorAll('[data-page]'));
  const navPrev = document.getElementById('navPrev');
  const navNext = document.getElementById('navNext');
  if (!form) return;

  const serial = generateSerial();
  if (serialEl) serialEl.textContent = serial;

  initCoverTilt(document.getElementById('pasaporteCover'));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FLIP_MS = 500;
  let currentPage = 1;
  let sealed = false;
  let sealing = false;

  function pageEl(n) {
    return pages.find((p) => Number(p.dataset.page) === n);
  }

  function navLabel(n) {
    if (n === 1) return 'Abrir pasaporte →';
    if (n === SELLO_PAGE && !sealed) return null; // el botón de sellar reemplaza a "Siguiente"
    if (n === TOTAL_PAGES) return null;
    return 'Siguiente →';
  }

  function updateChrome(n) {
    if (pageLabel) pageLabel.textContent = `PÁGINA ${n} DE ${TOTAL_PAGES}`;
    if (progressEl) progressEl.setAttribute('aria-valuenow', String(n));
    if (progressFill) progressFill.style.width = `${(n / TOTAL_PAGES) * 100}%`;

    navPrev.hidden = n === 1;

    const label = navLabel(n);
    navNext.hidden = label === null;
    if (label) navNext.textContent = label;

    if (n === SELLO_PAGE) {
      const tierValue = form.elements['tier'].value;
      const nombre = form.elements['nombre'].value.trim();
      document.getElementById('resumenNombre').textContent = nombre || '—';
      document.getElementById('resumenMoto').textContent = form.elements['moto'].value.trim() || '—';
      document.getElementById('resumenTier').textContent = TIER_LABELS[tierValue] || TIER_LABELS.standard;
      const mrzEl = document.getElementById('pasaporteMrz');
      if (mrzEl) mrzEl.textContent = generateMrz({ nombre, serial, tier: tierValue });
    }
  }

  function focusPage(panel) {
    const firstInput = panel && panel.querySelector('input:not([type="radio"]), input[type="radio"]:checked');
    if (firstInput) firstInput.focus({ preventScroll: true });
  }

  // Cambia de página como si se hojeara un pasaporte real: la saliente gira
  // sobre el lomo hacia adentro mientras la entrante gira hacia afuera,
  // sincronizadas para que nunca se vea el reverso de ninguna.
  function goToPage(n) {
    const oldPanel = pageEl(currentPage);
    const newPanel = pageEl(n);
    const forward = n > currentPage;
    currentPage = n;
    updateChrome(n);

    if (!oldPanel || oldPanel === newPanel || reduceMotion || !newPanel.animate) {
      pages.forEach((panel) => { panel.hidden = panel !== newPanel; });
      focusPage(newPanel);
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
      focusPage(newPanel);
    };
  }

  async function sealPassport() {
    if (sealing || sealed) return;
    sealing = true;
    const tierValue = form.elements['tier'].value;

    card.classList.add('is-stamped');
    await new Promise((r) => setTimeout(r, 500));
    card.classList.remove('is-stamped');

    sealed = true;
    sealing = false;
    goToPage(CONFIRM_PAGE);

    document.getElementById('confSerial').textContent = serial;
    document.getElementById('confTier').textContent = TIER_LABELS[tierValue] || TIER_LABELS.standard;

    if (typeof onSealed === 'function') onSealed();
  }

  navPrev.addEventListener('click', () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  });

  navNext.addEventListener('click', () => {
    if (currentPage === DATOS_PAGE && !validateDatos(form)) return;
    if (currentPage < TOTAL_PAGES) goToPage(currentPage + 1);
  });

  const cover = document.getElementById('pasaporteCover');
  if (cover) {
    cover.addEventListener('click', () => {
      if (currentPage === 1) goToPage(2);
    });
    cover.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && currentPage === 1) {
        event.preventDefault();
        goToPage(2);
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, textarea')) return;
    if (event.key === 'ArrowRight' && !navNext.hidden) navNext.click();
    if (event.key === 'ArrowLeft' && !navPrev.hidden) navPrev.click();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (currentPage === SELLO_PAGE) sealPassport();
  });

  updateChrome(1);
}
