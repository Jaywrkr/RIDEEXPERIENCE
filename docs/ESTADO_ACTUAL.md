# Estado actual del repositorio (RIDEEXPERIENCE)

> Última actualización: 2026-07-23. Este documento existe para que cualquier
> sesión nueva de IA (Claude, Codex, etc.) o cualquier persona pueda retomar
> el trabajo sin depender del historial de chat de una sesión anterior.

## Qué es este repo hoy

Es un **sitio estático** (sin backend, sin base de datos, sin build step).
Todo vive en HTML/CSS/JS plano, servido tal cual desde GitHub Pages.

No hay ningún framework, ningún `package.json`, ningún servidor. Lo que se
ve en el navegador es exactamente el código fuente.

## Qué contiene

### 1. `index.html` + `css/` + `js/` — Experiencia "pasaporte" (Las Tanusas)

Landing/experiencia interactiva de una sola página: portada tipo pasaporte
kraft físico, animación de bienvenida, countdown, sistema de pistas
(`clues.js`), sello de confirmación (`passport.js`), y transiciones de
página (`reveal.js`). Es una pieza de marketing/invitación para un evento
propio (no para Shineray), ya bastante iterada visualmente (flip 3D,
proporciones de documento real, etc.).

Este es el proyecto que le da nombre al repo. **No tiene relación funcional
con la propuesta de Shineray ni con la cotización de plataforma web** — son
piezas independientes que conviven en el mismo repositorio.

### 2. `shineray-deck/` — Deck de venta (PWA), no un sistema real

Presentación interactiva de 10 slides para pitchear a Shineray el concepto
"Un pasaporte, tres sellos" (sistema de notificaciones de correo
escalonadas en vez de recordatorios genéricos). Es una **PWA instalable**
de verdad (`manifest.webmanifest` + `sw.js` con cacheo real), pero es
**una demo/mockup del concepto, no el sistema funcionando**:

- Las "notificaciones" que se ven en la slide 7 son tarjetas HTML estáticas
  — no se envía ningún correo real.
- Los "sellos" que se desbloquean en la slide de cadencia son estado de
  JavaScript en el navegador — no persiste en ningún lado, no hay base de
  datos.
- No hay formulario de registro real, no hay panel administrativo, no hay
  backend.

Es, en esencia, un **storyboard navegable** para vender la idea — muy
pulido visualmente, cero lógica de servidor.

### 3. `robots.txt`, `sitemap.xml`, metadata SEO

Agregado en una rama aparte (`claude/seo-metadata-jay-jaramillo-4w1p6b`,
ya mergeada) para posicionar el sitio a nombre de Jay Jaramillo (@jaywrkr).
No afecta el resto del contenido.

## Lo que NO existe en este repo (importante)

- ❌ Backend / API REST
- ❌ Base de datos
- ❌ Panel administrativo (login, listado de asistentes, estadísticas)
- ❌ Envío real de correos (transaccional o programado)
- ❌ Autenticación de ningún tipo
- ❌ Cualquier persistencia de datos de un asistente/invitado real

Todo lo anterior está **prometido en la cotización comercial** (ver
`PROPUESTA_OFRECIDA.md`), pero no está construido todavía en ningún lado de
este repositorio.

## Documentos relacionados

- [`PROPUESTA_OFRECIDA.md`](./PROPUESTA_OFRECIDA.md) — qué se le cotizó al
  cliente (Sistema Web de Inscripción y Gestión de Asistentes).
- [`COMPARATIVA_Y_PLAN.md`](./COMPARATIVA_Y_PLAN.md) — brecha entre lo que
  hay hoy en este repo y lo que se ofreció, con plan para cerrarla.
