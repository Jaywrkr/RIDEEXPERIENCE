// Revela líneas de la bitácora a medida que entran en viewport (scroll-driven storytelling)
export function initReveal() {
  const lines = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || lines.length === 0) {
    lines.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = Array.from(lines).indexOf(entry.target) % 3;
          entry.target.style.transitionDelay = `${delay * 0.08}s`;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  lines.forEach((el) => observer.observe(el));
}

export function initScrollCue() {
  const cue = document.getElementById('scrollCue');
  if (!cue) return;
  const target = document.getElementById(cue.dataset.target);
  if (!target) return;
  cue.addEventListener('click', () => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// Resalta el punto activo de la navegación de slides a medida que se cruza
// cada escena, y revela el punto de "Tu viaje" una vez que el pasaporte se sella.
export function initSlideNav() {
  const dots = Array.from(document.querySelectorAll('#slideNav a'));
  if (dots.length === 0 || !('IntersectionObserver' in window)) return;

  const targets = dots
    .map((dot) => document.getElementById(dot.dataset.slideDot))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        dots.forEach((dot) => {
          dot.classList.toggle('is-active', dot.dataset.slideDot === entry.target.id);
        });
      });
    },
    { threshold: 0.6 }
  );

  targets.forEach((el) => observer.observe(el));
}

// Muestra la barra de marca persistente una vez que el hero sale de vista,
// como el header repetido de la propuesta en cada sección.
export function initTopbar() {
  const topbar = document.getElementById('topbar');
  const hero = document.getElementById('hero');
  if (!topbar || !hero || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      topbar.classList.toggle('is-visible', !entry.isIntersecting);
    },
    { rootMargin: '-90% 0px 0px 0px' }
  );
  observer.observe(hero);
}

// Parallax sutil de la duna del hero en scroll (dos capas a distinta velocidad
// para dar profundidad). Se omite con reduced-motion.
export function initHeroParallax() {
  const dune = document.getElementById('heroDune');
  const duneBack = document.getElementById('heroDuneBack');
  if (!dune) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const offset = Math.min(window.scrollY * 0.15, 80);
      dune.style.transform = `translateY(${offset}px)`;
      if (duneBack) duneBack.style.transform = `translateY(${offset * 0.5}px)`;
      ticking = false;
    });
  }, { passive: true });
}
