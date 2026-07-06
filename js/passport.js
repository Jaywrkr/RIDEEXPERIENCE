const TIER_LABELS = {
  standard: 'STANDARD — Convoy',
  plus: 'PLUS — Avanzada',
  elite: 'ELITE — Cabeza de expedición',
};

const TOTAL_STEPS = 4;

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

function validateStep2(form) {
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

// Dispersa el pasaporte en partículas de arena que el viento se lleva.
// Se omite si el usuario prefiere movimiento reducido: el cierre narrativo
// pasa a ser puramente el fundido CSS (.is-dissolving), sin partículas.
function runDustDissolve(cardEl, canvas) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !canvas.getContext) return Promise.resolve();

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

// Inclina la portada del pasaporte siguiendo el cursor, como si fuera un
// objeto físico que se puede tomar entre las manos. Se omite con reduced-motion.
function initCoverTilt(cover) {
  if (!cover) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX_TILT = 10;

  cover.addEventListener('mousemove', (event) => {
    const rect = cover.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    cover.style.transform = `perspective(1000px) rotateX(${(-py * MAX_TILT).toFixed(2)}deg) rotateY(${(px * MAX_TILT).toFixed(2)}deg) scale(1.02)`;
  });

  cover.addEventListener('mouseleave', () => {
    cover.style.transform = '';
  });
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
  if (!form) return;

  const serial = generateSerial();
  if (serialEl) serialEl.textContent = serial;

  initCoverTilt(document.getElementById('pasaporteCover'));

  let currentStep = 1;

  function showStep(n) {
    currentStep = n;
    panels.forEach((panel) => {
      panel.hidden = Number(panel.dataset.stepPanel) !== n;
    });
    stepDots.forEach((dot) => {
      const dotStep = Number(dot.dataset.stepDot);
      dot.classList.toggle('is-active', dotStep === n);
      dot.classList.toggle('is-done', dotStep < n);
    });
    if (stepLabel) stepLabel.textContent = `PASO ${n} DE ${TOTAL_STEPS}`;
    if (progressEl) progressEl.setAttribute('aria-valuenow', String(n));

    if (n === TOTAL_STEPS) {
      const tierValue = form.elements['tier'].value;
      const nombre = form.elements['nombre'].value.trim();
      document.getElementById('resumenNombre').textContent = nombre || '—';
      document.getElementById('resumenMoto').textContent = form.elements['moto'].value.trim() || '—';
      document.getElementById('resumenTier').textContent = TIER_LABELS[tierValue] || TIER_LABELS.standard;
      const mrzEl = document.getElementById('pasaporteMrz');
      if (mrzEl) mrzEl.textContent = generateMrz({ nombre, serial, tier: tierValue });
    }

    const panel = panels.find((p) => Number(p.dataset.stepPanel) === n);
    const firstInput = panel && panel.querySelector('input:not([type="radio"]), input[type="radio"]:checked');
    if (firstInput) firstInput.focus({ preventScroll: true });
  }

  const cover = document.getElementById('pasaporteCover');
  if (cover) {
    cover.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        cover.click();
      }
    });
  }

  form.addEventListener('click', (event) => {
    const nextBtn = event.target.closest('[data-next]');
    const prevBtn = event.target.closest('[data-prev]');

    if (nextBtn) {
      if (currentStep === 2 && !validateStep2(form)) return;
      showStep(Math.min(currentStep + 1, TOTAL_STEPS));
    } else if (prevBtn) {
      showStep(Math.max(currentStep - 1, 1));
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (currentStep !== TOTAL_STEPS) return;

    const tierValue = form.elements['tier'].value;

    document.body.dataset.state = 'sellando';
    card.classList.add('is-stamped');

    await new Promise((r) => setTimeout(r, 500));

    card.classList.add('is-dissolving');
    await runDustDissolve(card, canvas);

    document.getElementById('manifiesto').style.display = 'none';
    document.body.dataset.state = 'sellado';

    if (typeof onSealed === 'function') {
      onSealed({ serial, tierLabel: TIER_LABELS[tierValue] || TIER_LABELS.standard });
    }
  });
}
