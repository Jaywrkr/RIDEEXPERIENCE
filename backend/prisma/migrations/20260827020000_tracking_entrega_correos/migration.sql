-- Tracking real de entrega de correos, via webhook de Resend.
--
-- Hasta ahora "enviada" solo significaba "Resend acepto mandarlo" -- no
-- si de verdad llego, rebotó o se abrió. Estas columnas las completa el
-- webhook (notificaciones.controller.ts, POST /notificaciones/webhook-resend),
-- no el envio en si.

ALTER TABLE "notificaciones" ADD COLUMN "proveedor_id" TEXT;
ALTER TABLE "notificaciones" ADD COLUMN "entrega_estado" TEXT;
ALTER TABLE "notificaciones" ADD COLUMN "entrega_actualizada_en" TIMESTAMP(3);
ALTER TABLE "notificaciones" ADD COLUMN "abierta_en" TIMESTAMP(3);

CREATE INDEX "notificaciones_proveedor_id_idx" ON "notificaciones"("proveedor_id");
