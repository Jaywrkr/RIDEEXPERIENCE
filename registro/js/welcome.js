// Bienvenida a pantalla completa: nubes de arena que se disipan al hacer clic,
// revelando el resto del sitio debajo. Con reduced-motion, las nubes no
// dibujan partículas y el CSS global ya colapsa las transiciones a instantáneas.
function burstDust(canvas) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !canvas || !canvas.getContext || !canvas.parentElement) {
    return Promise.resolve();
  }

  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const colors = ['#d3ac66', '#e4cb98', '#b98a3a', '#c41e1e'];
  const particles = Array.from({ length: 220 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    return {
      x: cx + (Math.random() - 0.5) * rect.width * 0.6,
      y: cy + (Math.random() - 0.5) * rect.height * 0.6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: Math.random() * 4 + 1.5,
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  });

  return new Promise((resolve) => {
    function frame() {
      ctx.clearRect(0, 0, rect.width, rect.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= 0.014;
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
        ctx.clearRect(0, 0, rect.width, rect.height);
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

export function initWelcome({ onDismissed } = {}) {
  const overlay = document.getElementById('welcome');
  const cta = document.getElementById('welcomeCta');
  const canvas = document.getElementById('welcomeDustCanvas');
  if (!overlay || !cta) {
    // Sin overlay no hay nada que disipar, pero la tapa igual tiene que
    // entrar: si no, se quedaría oculta esperando una señal que no llega.
    onDismissed?.();
    return;
  }

  document.documentElement.classList.add('no-scroll');
  cta.focus({ preventScroll: true });

  let dismissing = false;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  async function dismiss() {
    if (dismissing) return;
    dismissing = true;

    overlay.classList.add('is-dispersing');
    await Promise.all([
      burstDust(canvas),
      new Promise((r) => setTimeout(r, reduceMotion ? 50 : 700)),
    ]);

    overlay.hidden = true;
    document.documentElement.classList.remove('no-scroll');
    onDismissed?.();
  }

  cta.addEventListener('click', (event) => {
    event.stopPropagation();
    dismiss();
  });
  overlay.addEventListener('click', dismiss);
}
