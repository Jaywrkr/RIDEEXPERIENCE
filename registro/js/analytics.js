// Eventos de embudo para Vercel Web Analytics. El script de analytics.js
// (cargado en index.html) expone window.va globalmente; en desarrollo
// local, o si el proyecto no tiene Web Analytics activado en Vercel, esa
// funcion no existe -- por eso cada llamada se protege, en vez de asumir
// que va() siempre esta disponible.
export function trackEvent(nombre, datos) {
  try {
    if (typeof window.va === 'function') {
      window.va('event', datos ? { name: nombre, data: datos } : { name: nombre });
    }
  } catch {
    // Un evento de analitica que falla no puede romper el registro real.
  }
}
