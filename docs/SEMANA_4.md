# Semana 4 — Notificaciones automáticas de correo

> Última actualización: 2026-08-24. Léase junto con `ESTADO_ACTUAL.md`,
> `PROPUESTA_OFRECIDA.md`, `COMPARATIVA_Y_PLAN.md` y `SEMANA_3.md`. Cierra
> los puntos 12, 13 y 14 del plan de la Semana 4 en `COMPARATIVA_Y_PLAN.md`.

## Qué se construyó

Módulo nuevo `backend/src/notificaciones/` que completa el ciclo que
quedaba pendiente desde la Semana 1: las filas `Notificacion` que se
crean al registrar un asistente (`PENDIENTE`) ahora se procesan y
efectivamente se envían.

- **Proveedor: Resend.** Se eligió porque ya se usa en este mismo repo
  (`lib/mailer.js`, backend del pasaporte de Las Tanusas) — reutilizar el
  mismo proveedor evita que manejes dos cuentas de correo transaccional
  distintas. Es la decisión que quedaba pendiente en
  `COMPARATIVA_Y_PLAN.md` § Riesgos; si preferís otro proveedor, avisame
  y se cambia (queda todo detrás de `MailerService`, un solo archivo).
- **`MailerService`** (`mailer.service.ts`): envuelve el SDK de Resend.
  Si no hay `RESEND_API_KEY` configurada, no falla — loguea el correo que
  habría mandado y sigue. Así el resto del backend funciona en desarrollo
  sin necesitar una cuenta de Resend real.
- **`NotificacionesService`** (`notificaciones.service.ts`): busca
  notificaciones `PENDIENTE` cuya `programadaPara` ya llegó, arma el
  asunto/cuerpo según el tipo (confirmación, aviso previo, aviso final) y
  las marca `ENVIADA` o `FALLIDA` según el resultado.
- **`NotificacionesScheduler`** (`notificaciones.scheduler.ts`): corre
  ese proceso cada minuto (`@nestjs/schedule`, cron real, no hay que
  pagar ni configurar nada externo). Un minuto de margen es suficiente
  para que la confirmación se sienta inmediata y no afecta en la
  práctica a los avisos previo/final, que se configuran con horas o días
  de anticipación desde el panel.
- **`POST /api/notificaciones/procesar`**: disparo manual protegido
  (mismo JWT del panel), para no depender de esperar el próximo ciclo del
  cron al probar o si alguna vez hace falta forzar un reenvío.
- **Plantillas** (`templates/correos.ts`): copy genérico por evento
  (usa nombre, lugar y fecha reales), no específico de un cliente — el
  sistema cotizado es genérico para cualquier congreso. El copy
  específico y ya validado para Shineray (slide "El mensaje real" del
  `shineray-deck/`) se puede pegar ahí mismo antes de desplegar ese
  evento puntual; no lo dejé hardcodeado porque este backend no debe
  asumir que el cliente final es siempre Shineray (ver riesgo ya
  anotado en `COMPARATIVA_Y_PLAN.md`).

## Cómo se probó

Con Postgres local y el backend corriendo (sin `RESEND_API_KEY`, o sea
en modo simulado):

1. Se creó un evento con fechas de aviso previo/final ya vencidas
   (a propósito, para no esperar) y se registró un asistente → quedaron
   3 notificaciones en `PENDIENTE`.
2. Se disparó `POST /api/notificaciones/procesar` a mano → las 3
   pasaron a `ENVIADA` y en el log del backend aparecieron los 3
   asuntos correctos, cada uno con el correo simulado en vez de un envío
   real (por no tener API key).
3. Aparte, se registró un segundo asistente y **sin disparar nada a
   mano** se esperó al ciclo automático del cron (cada minuto) — el
   backend procesó la notificación de confirmación solo, sin
   intervención.

## Qué NO incluye (queda para la Semana 4-5 / vos)

- **No hay reintentos automáticos**: una notificación que falla queda en
  `FALLIDA` y no se reintenta sola. Para un MVP es aceptable (se puede
  ver el estado por evento consultando la base), pero si el volumen es
  alto conviene agregar un reintento con backoff más adelante — no
  estaba en el alcance cotizado.
- **No hay `RESEND_API_KEY` real**: sin ella, ningún correo sale de
  verdad, solo se loguea. Ver `PENDIENTES_CLIENTE.md`.
- **El copy es genérico**, no el texto de marca específico de Shineray.

## Documentos relacionados

- [`ESTADO_ACTUAL.md`](./ESTADO_ACTUAL.md)
- [`PROPUESTA_OFRECIDA.md`](./PROPUESTA_OFRECIDA.md)
- [`COMPARATIVA_Y_PLAN.md`](./COMPARATIVA_Y_PLAN.md)
- [`SEMANA_3.md`](./SEMANA_3.md)
- [`PENDIENTES_CLIENTE.md`](./PENDIENTES_CLIENTE.md) — checklist
  actualizado con lo que falta configurar para que los correos salgan de
  verdad.
