// Cuenta regresiva hacia la llegada del bus al destino (secreto hasta el día del viaje).
// Convención Nacional Shineray 2026: 25, 26 y 27 de septiembre (UTC-5).
export const EVENT_DATE = new Date('2026-09-25T09:00:00-05:00');

export function initCountdown(onTick) {
  const els = {
    dias: document.getElementById('cd-dias'),
    horas: document.getElementById('cd-horas'),
    min: document.getElementById('cd-min'),
    seg: document.getElementById('cd-seg'),
  };

  function tick() {
    const now = new Date();
    const diffMs = EVENT_DATE - now;
    const diff = Math.max(diffMs, 0);

    const dias = Math.floor(diff / 86400000);
    const horas = Math.floor((diff % 86400000) / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    const seg = Math.floor((diff % 60000) / 1000);

    els.dias.textContent = String(dias).padStart(2, '0');
    els.horas.textContent = String(horas).padStart(2, '0');
    els.min.textContent = String(min).padStart(2, '0');
    els.seg.textContent = String(seg).padStart(2, '0');

    if (typeof onTick === 'function') onTick(diffMs);
  }

  tick();
  const intervalId = setInterval(tick, 1000);
  return () => clearInterval(intervalId);
}
