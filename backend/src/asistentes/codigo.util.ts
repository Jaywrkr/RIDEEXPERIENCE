// El correlativo de la base de datos (1, 2, 3...) empieza en 1 porque asi
// arranca cualquier secuencia de Postgres; el pasaporte visible arranca en
// 1001 porque asi lo pidio el cliente. El offset vive en un solo lugar
// para no repetirlo en cada método.
//
// Vive en su propio archivo (no en asistentes.service.ts) porque tanto
// AsistentesService como NotificacionesService lo necesitan: si viviera
// en asistentes.service.ts, notificaciones.service.ts importándolo de
// ahí crearía un import circular con asistentes.service.ts (que a su vez
// importa NotificacionesService para disparar el correo de confirmación).
export const OFFSET_CODIGO = 1000;

export function conCodigo<T extends { numero: number }>(asistente: T): T & { codigo: string } {
  return { ...asistente, codigo: `ATT-${OFFSET_CODIGO + asistente.numero}` };
}
