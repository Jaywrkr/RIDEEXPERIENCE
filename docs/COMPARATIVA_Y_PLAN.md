# Comparativa: lo que hay vs. lo que se ofreció, y plan para cerrar la brecha

> Última actualización: 2026-07-23. Léase junto con `ESTADO_ACTUAL.md` y
> `PROPUESTA_OFRECIDA.md`. El objetivo de este documento es que una sesión
> nueva sepa, de un vistazo, cuánto de lo cotizado ya existe y qué falta
> construir para poder entregarlo de verdad.

## Tabla comparativa

| Componente cotizado | ¿Existe en el repo hoy? | Detalle |
|---|---|---|
| Sitio de registro (formulario, info del evento) | ⚠️ Parcial | Existe UI/UX de referencia en `index.html` y en `shineray-deck/`, pero son piezas de marketing, no un formulario conectado a nada. No guardan datos reales. |
| Confirmación de registro | ⚠️ Simulada | El "sello 1" del deck se activa con JS local, no con un registro real en base de datos. |
| Panel administrativo (login, listado, stats) | ❌ No existe | Cero código de backend o de panel en el repo. |
| Backend / API REST | ❌ No existe | No hay ningún servidor, endpoint, ni `package.json` de backend. |
| Base de datos | ❌ No existe | No hay esquema, ni motor, ni conexión definida. |
| Notificaciones de correo automáticas (3 avisos) | ⚠️ Simuladas | El deck de Shineray muestra el *copy* de las 3 notificaciones como tarjetas estáticas (slide 7) — el contenido/tono ya está validado, pero no se envía ningún correo real ni hay programador de tareas. |
| PWA instalable (manifest + service worker) | ✅ Existe y funciona | `shineray-deck/manifest.webmanifest` y `shineray-deck/sw.js` son reales y probados — esto sí es reutilizable tal cual para el sitio de registro final. |
| Diseño responsive | ✅ Existe (nivel visual) | El deck y el pasaporte están bien resueltos en mobile. Sirve como referencia de estilo, no como código de producción del formulario. |
| Hosting y dominio | ❌ No gestionado | Hoy se sirve gratis desde GitHub Pages (`jaywrkr.github.io/rideexperience/...`). La cotización promete hosting y dominio propios — eso implica una migración a infraestructura paga. |
| Validaciones de seguridad | ❌ No existe | No hay backend, por lo tanto no hay nada que validar todavía. |

**Resumen:** lo que existe hoy es **la capa visual y el copy validado**
(cómo se ve y qué dice el sistema). Lo que falta es **toda la capa
funcional** (backend, base de datos, panel, envío real de correos,
hosting/dominio propios). Es, en términos de esfuerzo, el trabajo que
todavía no ha empezado.

## Plan para llegar a lo ofrecido

Pensado para caber en las **4-5 semanas** prometidas en la cotización.

### Semana 1 — Backend base
1. Crear proyecto NestJS (API REST).
2. Definir esquema de base de datos en PostgreSQL: tabla `eventos`,
   tabla `asistentes` (cédula, nombre, correo, teléfono, estado de
   registro, timestamps).
3. Endpoint de registro de asistente + validaciones (cédula única,
   formato de correo, etc.).
4. Endpoint de login de administrador (JWT o sesión simple).

### Semana 2 — Panel administrativo
5. Vista de login.
6. Vista de gestión del evento (editar info, agenda, lugar, fecha).
7. Vista de listado de asistentes + búsqueda/consulta individual.
8. Vista de total de registrados (contador simple, no requiere
   analítica compleja).

### Semana 3 — Sitio de registro real
9. Reemplazar el formulario estático del deck por un formulario
   conectado al endpoint de registro de la Semana 1.
10. Pantalla de confirmación real (reemplaza el "sello 1" simulado).
11. Reutilizar tal cual `manifest.webmanifest` y `sw.js` del deck para
    que el sitio de registro sea instalable — este paso es directo,
    no hay que rehacer nada de eso.

### Semana 4 — Notificaciones automáticas
12. Integrar proveedor de correo transaccional (a definir: Resend,
    SendGrid, u otro con SMTP simple).
13. Programador de tareas (cron o cola) que dispare los 3 avisos:
    confirmación inmediata, aviso previo (fecha configurable desde el
    panel), aviso final.
14. Reusar el copy ya validado en `shineray-deck` (slide 7) como
    plantilla real de los 3 correos — ese texto ya fue aprobado
    conceptualmente, solo falta conectarlo a un envío real.

### Semana 4-5 — QA, hosting y entrega
15. Pruebas funcionales end-to-end (registro → correo → panel).
16. Contratar y configurar hosting + dominio (comprometido en el
    precio de la cotización — definir proveedor).
17. Despliegue en producción.
18. Capacitación básica al equipo organizador sobre el panel.

## Riesgos / decisiones pendientes

- **Proveedor de correo transaccional**: no está decidido. Afecta costo
  operativo (fuera del alcance cotizado, es gasto del cliente o nuestro
  según se acuerde).
- **Proveedor de hosting**: la cotización promete "incluido", pero no
  especifica cuál. Definir antes de la Semana 4 para no atrasar el
  despliegue.
- **Dominio**: falta decidir el nombre y comprarlo — es un paso manual
  con costo recurrente que hay que presupuestar aparte del desarrollo.
- El deck de Shineray (`shineray-deck/`) es un **caso de uso específico**
  (evento "A todo terreno"). El sistema cotizado es genérico para
  cualquier congreso — al construir el backend, no hay que asumir que
  el cliente final es Shineray.

## Documentos relacionados

- [`ESTADO_ACTUAL.md`](./ESTADO_ACTUAL.md)
- [`PROPUESTA_OFRECIDA.md`](./PROPUESTA_OFRECIDA.md)
