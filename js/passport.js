const TIER_LABELS = {
  standard: 'STANDARD — Convoy',
  plus: 'PLUS — Avanzada',
  elite: 'ELITE — Cabeza de expedición',
};

// Genera un número de pasaporte estable para esta sesión, con formato
// consistente con la serie de la Convención Nacional Shineray 2026.
function generateSerial() {
  const n = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, '0');
  return `AT26-${n}`;
}

function validate(form) {
  let ok = true;
  const required = ['nombre', 'moto', 'ciudad'];
  required.forEach((name) => {
    const input = form.elements[name];
    const errorEl = document.getElementById(`err-${name}`);
    const value = input.value.trim();
    if (!value) {
      ok = false;
      input.classList.add('invalid');
      errorEl.textContent = 'Este dato es necesario para el manifiesto.';
    } else {
      input.classList.remove('invalid');
      errorEl.textContent = '';
    }
  });
  return ok;
}

// Dispersa el manifiesto en partículas de arena que el viento se lleva.
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

export function initPassportForm({ onSealed }) {
  const form = document.getElementById('passportForm');
  const card = document.getElementById('manifiestoCard');
  const canvas = document.getElementById('dustCanvas');
  const serialEl = document.getElementById('passportSerial');
  if (!form) return;

  const serial = generateSerial();
  if (serialEl) serialEl.textContent = serial;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validate(form)) return;

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
