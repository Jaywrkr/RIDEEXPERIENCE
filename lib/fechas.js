// Fechas de desbloqueo del sello 2 y 3, configuradas por variable de entorno
// (ISO 8601, ej. "2026-09-26T00:00:00-05:00") para poder ajustarlas sin tocar
// código. Si una fecha no está configurada, ese sello nunca se autodesbloquea.
export function fechaDesbloqueoSello(n) {
  const raw = n === 2 ? process.env.FECHA_SELLO_2 : n === 3 ? process.env.FECHA_SELLO_3 : null;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function yaLlegoFecha(n) {
  const fecha = fechaDesbloqueoSello(n);
  return fecha ? Date.now() >= fecha.getTime() : false;
}
