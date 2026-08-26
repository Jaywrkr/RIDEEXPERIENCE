// Rastro de arena en la tapa: arrastrar el dedo (o el mouse) deja granos
// que se asientan y se desvanecen, como trazar sobre arena de verdad.
// Reutiliza el mismo lenguaje visual que el estallido de polvo de la
// bienvenida (particulas cuadradas en tonos calidos), pero como una
// estela continua en vez de una explosion puntual.
export function initRastroArena() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cover = document.getElementById('pasaporteCover');
  const canvas = document.getElementById('coverArenaCanvas');
  if (!cover || !canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const colores = ['#d3ac66', '#e4cb98', '#b98a3a'];
  let particulas = [];
  let dpr = 1;
  let animando = false;
  let ultimoPunto = null;

  function ajustarTamano() {
    const rect = cover.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  ajustarTamano();
  window.addEventListener('resize', ajustarTamano);

  function agregarGrano(x, y) {
    particulas.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vy: Math.random() * 0.3,
      size: Math.random() * 2.2 + 0.8,
      life: 1,
      color: colores[Math.floor(Math.random() * colores.length)],
    });
  }

  function frame() {
    const rect = cover.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    particulas = particulas.filter((p) => p.life > 0);
    particulas.forEach((p) => {
      p.y += p.vy; // los granos se asientan, no flotan
      p.life -= 0.018;
      ctx.globalAlpha = Math.max(p.life, 0) * 0.6;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    if (particulas.length > 0) {
      requestAnimationFrame(frame);
    } else {
      animando = false;
    }
  }

  function alPunto(x, y) {
    // Un grano cada pocos px recorridos, no en cada evento: a la
    // resolucion de pointermove le sobran puntos para lo que hace falta.
    if (ultimoPunto) {
      const d = Math.hypot(x - ultimoPunto.x, y - ultimoPunto.y);
      if (d < 4) return;
    }
    ultimoPunto = { x, y };
    for (let i = 0; i < 3; i += 1) agregarGrano(x, y);
    if (!animando) {
      animando = true;
      requestAnimationFrame(frame);
    }
  }

  let arrastrando = false;
  cover.addEventListener('pointerdown', (event) => {
    arrastrando = true;
    const rect = cover.getBoundingClientRect();
    alPunto(event.clientX - rect.left, event.clientY - rect.top);
  });
  cover.addEventListener('pointermove', (event) => {
    if (!arrastrando) return;
    const rect = cover.getBoundingClientRect();
    alPunto(event.clientX - rect.left, event.clientY - rect.top);
  });
  window.addEventListener('pointerup', () => {
    arrastrando = false;
    ultimoPunto = null;
  });
}
