-- Correlativo real del pasaporte (ATT-1001, ATT-1002...), asignado por
-- la propia base de datos en el momento del INSERT.
--
-- Se usa una columna autoincremental de Postgres (via secuencia) en vez
-- de calcular "el siguiente numero" leyendo un COUNT desde la app: dos
-- registros que llegan al mismo tiempo podrian leer el mismo COUNT antes
-- de que ninguno de los dos escriba, y terminar con el mismo numero. La
-- secuencia de Postgres entrega cada valor una sola vez sin ese riesgo.
--
-- El numero visible ("ATT-1001") se arma en la app como "ATT-" + (1000 +
-- numero): el primer asistente en registrarse tiene numero = 1.

CREATE SEQUENCE "asistentes_numero_seq";

ALTER TABLE "asistentes"
  ADD COLUMN "numero" INTEGER NOT NULL DEFAULT nextval('asistentes_numero_seq');

ALTER SEQUENCE "asistentes_numero_seq" OWNED BY "asistentes"."numero";

CREATE UNIQUE INDEX "asistentes_numero_key" ON "asistentes"("numero");
