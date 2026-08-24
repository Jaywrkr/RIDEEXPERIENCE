# Pendientes para vos (configuración, decisiones y cuentas que no puede resolver una sesión de IA)

> Última actualización: 2026-08-24. Lista viva — se actualiza en cada
> semana del plan. Todo lo de acá son cosas que requieren una decisión de
> negocio, una cuenta/credencial real, o una acción manual en GitHub — no
> es código pendiente, es lo que falta de tu lado para poder desplegar
> esto de verdad.

## Urgente / bloquea el deploy de prueba

- [ ] **Terminar de configurar `rideexperience-api` en Vercel** — ya está
  desplegado en https://rideexperience-api.vercel.app pero le faltan 2
  variables de entorno para arrancar (confirmado en los logs reales del
  deploy). Los 4 pasos exactos, todos desde el dashboard de Vercel, sin
  instalar nada: ver [`DESPLIEGUE_VERCEL.md`](./DESPLIEGUE_VERCEL.md).
  Resumen: conectar una base Postgres desde la pestaña Storage, agregar
  `DATABASE_URL` y `JWT_SECRET`, y volver a desplegar.

- [ ] **Borrar 2 ramas de GitHub que ya están fusionadas** y no se
  pudieron borrar automáticamente (el token de esta sesión no tiene
  permiso de borrado de ramas):
  - `claude/seo-metadata-jay-jaramillo-4w1p6b`
  - `claude/passport-stamp-notifications-s0vk0a`
  Ambas ya están 100% incluidas en `claude/las-tanusas-landing-8ttqff`
  (la rama por defecto del repo — este repo no tiene `main`/`master`).
  Borrarlas es seguro. Se hace desde GitHub → pestaña "Branches", o desde
  el botón "Delete branch" que queda en cada Pull Request ya mergeado.

## Antes de que esto sea producción de verdad (no solo prueba)

- [ ] **Crear el/los administrador(es) real(es) del panel**, con su
  correo y contraseña definitivos — los de prueba (`admin@test.com` /
  `password123`) solo existieron en bases locales que ya se borraron. En
  cuanto configures `DATABASE_URL` (paso de arriba), avisame y te creo
  el tuyo, o lo hacés vos mismo corriendo
  `ADMIN_EMAIL=... ADMIN_PASSWORD=... npx prisma db seed` desde donde
  tengas Node instalado.
- [ ] El `JWT_SECRET` que uses en el paso de arriba puede quedar como
  está una vez generado — no hace falta rotarlo salvo sospecha de fuga.
- [ ] Dominio propio en vez de `*.vercel.app` (opcional, cosmético).

## Para que los correos salgan de verdad (Semana 4)

- [ ] **Crear cuenta en [Resend](https://resend.com)** (o decirme si
  preferís otro proveedor — queda todo detrás de un solo archivo,
  `backend/src/notificaciones/mailer.service.ts`, cambiarlo es rápido).
  Ya se usa Resend en el backend del pasaporte de Las Tanusas
  (`lib/mailer.js`), así que si ya tenés esa cuenta podés reusarla.
- [ ] **Verificar tu dominio de envío en Resend** (o usar su dominio de
  pruebas mientras tanto) y generar una API key.
- [ ] Poner esa key en `RESEND_API_KEY` y el remitente en
  `RESEND_FROM_EMAIL` en el `.env` del backend de producción. Sin esto,
  el sistema sigue registrando gente y creando las notificaciones en la
  base de datos, pero no manda ningún correo real — solo lo loguea.
- [ ] Opcional: `REGISTRO_SITIO_URL` con la URL pública del sitio de
  registro, para que los correos incluyan un link "Ver información del
  evento".
- [ ] **Revisar/reemplazar el copy de los 3 correos** en
  `backend/src/notificaciones/templates/correos.ts` si querés el tono
  específico de marca (por ejemplo, el ya validado para Shineray en
  `shineray-deck/index.html`, slide "El mensaje real") en vez del texto
  genérico actual.

## Antes de publicar cada evento/sitio de registro

- [ ] Editar `registro/js/config.js`:
  - `API_BASE_URL`: la URL pública del backend ya desplegado.
  - `EVENTO_ID`: el ID (UUID) del evento, que te lo da el panel admin
    cuando lo creás — se ve en la respuesta al crearlo o consultando
    `GET /api/eventos`. Si lo dejás vacío, el sitio muestra
    automáticamente "el primer evento que encuentre", útil solo para
    probar en local.
- [ ] Editar `admin/js/api.js` (constante `API_BASE_URL` al inicio) para
  que apunte también al backend de producción — hoy apunta a
  `localhost:3000`.
- [ ] Reemplazar `registro/icon.svg` y el `name`/`short_name` de
  `registro/manifest.webmanifest` con la identidad visual del evento, si
  querés que se vea distinto al genérico actual.

## Decisiones de negocio pendientes (afectan la Semana 4-5)

- [ ] **Proveedor de correo transaccional**: no está decidido (Resend,
  SendGrid, u otro). El backend de Las Tanusas (`lib/mailer.js`, rama ya
  fusionada) ya usa Resend para un caso parecido — podría ser el mismo
  proveedor para no duplicar cuentas, pero es tu decisión. Afecta costo
  operativo mensual, que está fuera de lo cotizado (USD 1,100 + IVA
  cubre desarrollo + hosting, no el costo recurrente de envíos de
  correo).
- [ ] **Dominio**: falta decidir el nombre y comprarlo. Tiene costo
  recurrente aparte del desarrollo.
- [ ] **Proveedor de hosting definitivo**: la cotización promete
  "incluido", pero no dice cuál — hay que elegirlo antes de la Semana 4
  para no atrasar el despliegue.

## Ya resuelto (para referencia, no requiere acción)

- ✅ Esquema de base de datos, backend y endpoints de registro/login —
  Semana 1.
- ✅ Panel administrativo (login, gestión de evento, listado de
  asistentes) — Semana 2.
- ✅ Sitio público de registro conectado de verdad, PWA instalable —
  Semana 3.
- ✅ Notificaciones automáticas de correo (confirmación, aviso previo,
  aviso final) con cron real cada minuto — Semana 4. Falta solo la
  cuenta de Resend real (ítem arriba) para que salgan de verdad.
- ✅ Ramas de trabajo unidas a la rama por defecto del repo.
- ✅ Los 3 componentes desplegados en Vercel en URLs reales
  (`rideexperience-api`, `-admin`, `-registro`), auto-desplegando en cada
  push. Falta solo terminar de configurarlo (ítem "Urgente" arriba).

## Documentos relacionados

- [`ESTADO_ACTUAL.md`](./ESTADO_ACTUAL.md)
- [`PROPUESTA_OFRECIDA.md`](./PROPUESTA_OFRECIDA.md)
- [`COMPARATIVA_Y_PLAN.md`](./COMPARATIVA_Y_PLAN.md) — plan completo de
  5 semanas y la tabla de brecha original.
- [`SEMANA_3.md`](./SEMANA_3.md) — sitio de registro (Semana 3).
- [`SEMANA_4.md`](./SEMANA_4.md) — notificaciones de correo (Semana 4).
- [`DESPLIEGUE_VERCEL.md`](./DESPLIEGUE_VERCEL.md) — URLs del deploy de
  prueba y los pasos exactos que faltan para activarlo.
- [`GUIA_PRUEBAS_LOCAL.md`](./GUIA_PRUEBAS_LOCAL.md) — paso a paso para
  correr y probar todo esto vos mismo, en tu máquina.
