-- Check-in del dia del evento: marca cuando el organizador confirma
-- que un asistente llego, para no tener que cotejar la lista a mano
-- en la entrada.

ALTER TABLE "asistentes" ADD COLUMN "llegada_en" TIMESTAMP(3);
