-- AVISO_PREVIO y AVISO_FINAL pasan de enviarse uno por uno a mandarse
-- como un solo Resend Broadcast a toda la Audience -- Resend se encarga
-- del ritmo de entrega en vez de nuestro loop paceado. Antes de crear el
-- broadcast hay que sincronizar cada asistente pendiente como contacto de
-- la Audience (tambien sujeto al limite de 2 req/s de Resend); esta
-- columna marca a quien ya se sincronizo para no repetirlo en cada
-- corrida del cron mientras dura esa fase.

ALTER TABLE "notificaciones" ADD COLUMN "sincronizada_en_audiencia" BOOLEAN NOT NULL DEFAULT false;
