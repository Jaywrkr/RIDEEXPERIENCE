# Estado actual del repositorio (RIDEEXPERIENCE)

> Última actualización: 2026-08-24. Este documento existe para que
> cualquier sesión nueva de IA (Claude, Codex, etc.) o cualquier persona
> pueda retomar el trabajo sin depender del historial de chat de una
> sesión anterior. **Reemplaza por completo la versión del 2026-07-23**
> — desde entonces se construyó y desplegó todo el sistema real.

## Resumen: el sistema ya está en producción y probado de punta a punta

Lo que la cotización a Shineray prometía (`PROPUESTA_OFRECIDA.md`) —
backend, panel administrativo, sitio de registro, notificaciones — ya
existe, está desplegado en Vercel, y **el usuario ya lo probó
completo en el navegador con datos reales y confirmó que funciona**:
login del panel, creación del evento, registro con cédula real desde
el pasaporte, y el asistente apareciendo en el panel.

## URLs en producción (Vercel)

| Qué es | URL |
|---|---|
| **Sitio público** (pasaporte de registro, esto es lo que ve el cliente al escanear el QR) | **https://atodoterreno.vercel.app** |
| Panel administrativo | **https://rideexperience-admin.vercel.app** |
| Backend / API | https://rideexperience-api.vercel.app |

Los tres son proyectos de Vercel enlazados al mismo repo de GitHub,
rama `claude/las-tanusas-landing-8ttqff` (no existe rama `main` en este
repo — esa es la que hace de rama por defecto). **Cada push a esa rama
los redespliega solos**, no hace falta ningún paso manual.

- `rideexperience-api`: rootDirectory = `backend/`.
- `rideexperience-admin`: rootDirectory = `admin/`.
- `atodoterreno`: rootDirectory = `registro/` (este es el que el
  cliente ve — reemplazó al viejo pasaporte de código de acceso que
  vivía en la raíz del repo).
- Hay un cuarto proyecto, `rideexperience` (rootDirectory = raíz del
  repo), que sigue sirviendo el pasaporte VIEJO con código de acceso
  (`index.html`, `api/validar-codigo.js`, etc.) — **es el sistema
  anterior, ya no es el que se usa**, pero sigue ahí funcionando. Ver
  sección "Qué contiene" más abajo y `PROXIMAS_FASES.md`.

Base de datos: Postgres (Neon) conectado a `rideexperience-api` vía
Vercel Storage. Ya migrada (tablas creadas) y con un admin real
(`jaywrkr@gmail.com`).

## Qué contiene el repo

### 1. `backend/` — API REST (NestJS + Prisma + PostgreSQL)

El sistema real cotizado a Shineray. Desplegado como función serverless
en Vercel (`backend/api/[...proxy].ts`). Incluye:
- Auth JWT para el panel (`POST /api/auth/login`).
- CRUD de eventos (`/api/eventos`).
- Registro de asistentes con validación real de cédula ecuatoriana
  (dígito verificador, no solo formato) — `/api/eventos/:id/asistentes`.
- Notificaciones de correo (confirmación, aviso previo, aviso final) vía
  Resend — `backend/src/notificaciones/`. Sin `RESEND_API_KEY`
  configurada, el sistema sigue funcionando pero solo loguea los
  correos en vez de mandarlos de verdad (ver `PROXIMAS_FASES.md`).
- Migraciones de Prisma corren solas en cada deploy de Vercel
  (`vercel-build` script) — no hace falta correrlas a mano.

Ver [`backend/README.md`](../backend/README.md).

### 2. `admin/` — Panel administrativo

Sitio estático (HTML/CSS/JS plano, sin build step) para gestionar **el
único evento** (A Todo Terreno) y ver los asistentes registrados. Sin
selector de eventos a propósito — este sistema es de un solo evento,
no multi-tenant.

### 3. `registro/` — Sitio público de registro (el pasaporte real)

Es el pasaporte digital completo de "A Todo Terreno" — portada kraft,
animación de apertura, MRZ, sello de tinta al confirmar — copiado
visualmente de `index.html` (ver punto 5) pero **recableado al backend
real**: sin código de acceso previo, con cédula/nombre/teléfono/correo,
registrando contra la base de datos de verdad. Es lo que corre en
`atodoterreno.vercel.app`.

Ver [`registro/README.md`](../registro/README.md).

### 4. `shineray-deck/` — Deck de venta (PWA), no un sistema real

Presentación interactiva de 10 slides para pitchear a Shineray el
concepto "Un pasaporte, tres sellos". Sigue siendo solo un
storyboard/mockup visual — no tiene relación funcional con el sistema
real que se construyó después. Se mantiene como pieza de venta.

### 5. `index.html` + `css/` + `js/` + `api/` + `lib/` + `db/` — Pasaporte VIEJO (código de acceso)

El sistema **anterior** de "A Todo Terreno": pasaporte con código de
acceso pre-generado (no cédula), backend en funciones serverless de
Vercel + Postgres propio, notificaciones de sellos vía Resend
(`lib/mailer.js`). Sigue viviendo en la raíz del repo y sigue
desplegado en `rideexperience.vercel.app`, pero **ya no es el sistema
que usa el cliente** — fue reemplazado por `registro/` en
`atodoterreno.vercel.app`. Queda pendiente decidir si se apaga o se
deja como está (ver `PROXIMAS_FASES.md`).

### 6. `robots.txt`, `sitemap.xml`, metadata SEO

Sin relación con lo anterior, posiciona el sitio a nombre de Jay
Jaramillo (@jaywrkr).

## Documentos relacionados

- [`PROPUESTA_OFRECIDA.md`](./PROPUESTA_OFRECIDA.md) — qué se cotizó.
- [`COMPARATIVA_Y_PLAN.md`](./COMPARATIVA_Y_PLAN.md) — plan original de
  5 semanas (ya completado en su mayoría).
- [`SEMANA_3.md`](./SEMANA_3.md), [`SEMANA_4.md`](./SEMANA_4.md) —
  detalle técnico de cada parte construida.
- [`DESPLIEGUE_VERCEL.md`](./DESPLIEGUE_VERCEL.md) — cómo está
  configurado el despliegue en Vercel.
- [`GUIA_PRUEBAS_LOCAL.md`](./GUIA_PRUEBAS_LOCAL.md) — alternativa para
  correr todo en una máquina local (ya no hace falta, todo está en
  producción, pero sirve para desarrollo).
- [`PENDIENTES_CLIENTE.md`](./PENDIENTES_CLIENTE.md) — checklist de
  configuración pendiente (Resend, dominio, etc.).
- [`PROXIMAS_FASES.md`](./PROXIMAS_FASES.md) — qué sigue después de
  esta sesión.
