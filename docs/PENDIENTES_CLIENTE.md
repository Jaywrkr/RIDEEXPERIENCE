# Pendientes para vos (configuración, decisiones y cuentas que no puede resolver una sesión de IA)

> Última actualización: 2026-08-24. Lista viva. El sistema ya está en
> producción y **probado de punta a punta por vos**: login, creación del
> evento, registro real desde el pasaporte, asistente visible en el
> panel. Esto es lo que queda, todo opcional o de cierre — nada de esto
> bloquea seguir usando el sistema como está hoy.

## Notificaciones de correo reales (todavía simuladas)

- [ ] Crear cuenta en [Resend](https://resend.com) (o confirmar si se
  reusa la que ya usa el pasaporte viejo, `lib/mailer.js` — mismo
  proveedor, evita duplicar cuentas).
- [ ] Verificar tu dominio de envío en Resend (o usar su dominio de
  pruebas mientras tanto) y generar una API key.
- [ ] Cargar `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en
  **Vercel → proyecto `rideexperience-api` → Settings → Environment
  Variables**, y redesplegar. Sin esto, el sistema sigue registrando
  gente normal, pero los correos solo quedan logueados, no se mandan.
- [ ] Opcional: revisar/reemplazar el copy de los 3 correos en
  `backend/src/notificaciones/templates/correos.ts` — hoy es genérico,
  se puede llevar al tono de marca de Shineray (hay copy ya validado
  para esto en `shineray-deck/index.html`, slide "El mensaje real").

## Decisión pendiente: el pasaporte viejo (código de acceso)

- [ ] `rideexperience.vercel.app` sigue sirviendo el sistema **anterior**
  (pasaporte con código de acceso pre-generado, no cédula). Ya no es el
  que usa el cliente — lo reemplazó `atodoterreno.vercel.app` — pero
  sigue activo con su propia base de datos. Decidir si:
  - Se deja como está (no molesta, pero es infra sin uso real).
  - Se pausa el proyecto en Vercel (reversible, no borra nada).
  - Se retira el código de la raíz del repo (esto sí requiere
    confirmación tuya explícita antes de tocarlo — esa base puede
    tener inscripciones reales de gente que ya usó un código).

## Cierre

- [ ] **Borrar 2 ramas de GitHub** ya fusionadas y seguras de eliminar
  (el token de esta sesión no tiene permiso, hay que hacerlo a mano):
  `claude/seo-metadata-jay-jaramillo-4w1p6b` y
  `claude/passport-stamp-notifications-s0vk0a`. GitHub → pestaña
  "Branches", o el botón "Delete branch" en cada Pull Request ya
  mergeado.
- [ ] **Dominio propio** en vez de `*.vercel.app` (opcional, cosmético
  — hay que comprarlo y configurarlo en el proyecto `atodoterreno`).
- [ ] Confirmar la fecha real del evento — hoy está hardcodeada como
  25-27 de septiembre 2026 en varios archivos de `registro/`. Si
  cambia, avisame y la actualizo.
- [ ] **Detalles de UI**: mencionaste que hay algunos ajustes visuales
  pendientes, sin especificar cuáles — decímelos en la próxima sesión.

## Ya resuelto (para referencia, no requiere acción)

- ✅ Backend, base de datos (Postgres/Neon), autenticación — funcionando
  en producción.
- ✅ Panel administrativo simplificado a un solo evento (sin selector).
- ✅ Sitio público de registro con el pasaporte visual real de Shineray,
  conectado al backend — **probado con una cédula real por vos**.
- ✅ Notificaciones: el mecanismo funciona (falta solo la cuenta de
  Resend real, ítem arriba, para que los correos salgan de verdad).
- ✅ Los 3 componentes desplegados en Vercel, con CORS y migraciones
  automáticas en cada push. Admin real creado (`jaywrkr@gmail.com`).
- ✅ Ramas de trabajo unidas a la rama por defecto del repo.

## Documentos relacionados

- [`ESTADO_ACTUAL.md`](./ESTADO_ACTUAL.md) — foto completa del repo hoy.
- [`PROXIMAS_FASES.md`](./PROXIMAS_FASES.md) — el mismo contenido de
  este documento, ordenado como plan de trabajo para la próxima sesión.
- [`PROPUESTA_OFRECIDA.md`](./PROPUESTA_OFRECIDA.md) — qué se cotizó.
- [`COMPARATIVA_Y_PLAN.md`](./COMPARATIVA_Y_PLAN.md) — plan original de
  5 semanas (ya completado en su mayoría).
- [`SEMANA_3.md`](./SEMANA_3.md) / [`SEMANA_4.md`](./SEMANA_4.md) —
  detalle técnico de sitio de registro / notificaciones.
- [`DESPLIEGUE_VERCEL.md`](./DESPLIEGUE_VERCEL.md) — configuración del
  despliegue en Vercel.
- [`GUIA_PRUEBAS_LOCAL.md`](./GUIA_PRUEBAS_LOCAL.md) — alternativa para
  correr todo en una máquina local (no hace falta, todo está en
  producción, pero sirve para desarrollo).
