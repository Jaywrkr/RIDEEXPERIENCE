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
  const target = document.getElementById('bitacora');
  if (!cue || !target) return;
  cue.addEventListener('click', () => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
