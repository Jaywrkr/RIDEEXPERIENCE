-- Tercer aviso programado, entre AVISO_PREVIO y AVISO_FINAL: el cliente
-- pasa de 2 correos de seguimiento a 3, en fechas fijas distintas
-- (ver docs/PENDIENTES_CLIENTE.md).

ALTER TYPE "TipoNotificacion" ADD VALUE 'AVISO_INTERMEDIO';

ALTER TABLE "eventos" ADD COLUMN "fecha_aviso_intermedio" TIMESTAMP(3);
