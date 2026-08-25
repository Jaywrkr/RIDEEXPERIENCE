-- Retira la cedula del registro de asistentes.
--
-- ATENCION: esta migracion BORRA la columna "cedula" y los datos que
-- contenga. Es irreversible. Si hay inscripciones previas y esos numeros
-- hacen falta para algo, hay que exportarlos ANTES de aplicarla.
--
-- La restriccion unica (evento_id, cedula) era lo unico que impedia que
-- la misma persona se inscribiera dos veces al mismo evento. Al quitar la
-- cedula, ese papel pasa al correo, que es la clave natural que queda.

-- 1) Fuera el indice unico viejo, que depende de la columna.
DROP INDEX IF EXISTS "asistentes_evento_id_cedula_key";

-- 2) Antes de poder crear el indice unico por correo hay que resolver los
--    duplicados que pudieran existir: hasta ahora nada impedia repetir
--    correo dentro de un evento. Se conserva la inscripcion mas antigua
--    de cada correo y se eliminan las posteriores.
DELETE FROM "asistentes" a
USING "asistentes" b
WHERE a."evento_id" = b."evento_id"
  AND lower(a."correo") = lower(b."correo")
  AND (a."created_at" > b."created_at"
       OR (a."created_at" = b."created_at" AND a."id" > b."id"));

-- 3) Nueva clave natural.
CREATE UNIQUE INDEX "asistentes_evento_id_correo_key"
  ON "asistentes"("evento_id", "correo");

-- 4) Y recien ahora la columna.
ALTER TABLE "asistentes" DROP COLUMN "cedula";
