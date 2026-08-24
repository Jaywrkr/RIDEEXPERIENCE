# Semana 3 — Sitio de registro real

> Última actualización: 2026-08-24. Léase junto con `ESTADO_ACTUAL.md`,
> `PROPUESTA_OFRECIDA.md` y `COMPARATIVA_Y_PLAN.md`. Este documento cierra
> los puntos 9, 10 y 11 del plan de la Semana 3 en `COMPARATIVA_Y_PLAN.md`.

## Qué se construyó

Carpeta nueva `registro/` — el sitio público que reemplaza el formulario
estático del `shineray-deck/` (slide de registro) por uno conectado de
verdad al backend de la Semana 1.

- **`registro/index.html` + `js/main.js`**: página única con tres estados
  (carga → formulario → confirmación). Al entrar, pide el evento a
  `GET /api/eventos/:id` (o `GET /api/eventos` si no hay uno fijado) y
  muestra nombre, lugar, fecha y descripción reales, no texto de mockup.
- **Formulario de inscripción**: cédula, nombre, correo, teléfono →
  `POST /api/eventos/:eventoId/asistentes`. Usa las mismas validaciones
  del backend (cédula ecuatoriana real, cédula única por evento, formato
  de correo/teléfono) y muestra el error tal cual lo devuelve la API
  (por ejemplo "Esta cedula ya esta registrada en este evento.").
- **Pantalla de confirmación real**: reemplaza el "sello 1" simulado del
  deck — ya no es estado de JavaScript sin persistencia, es la respuesta
  real de la API después de haber guardado el registro en la base de
  datos.
- **PWA instalable**: `registro/manifest.webmanifest` y `registro/sw.js`
  son una adaptación directa de `shineray-deck/manifest.webmanifest` y
  `shineray-deck/sw.js` (mismo enfoque de cache, solo cambia el nombre del
  cache y la lista de archivos del "shell"), tal como estaba planeado —
  "reutilizar tal cual, no hay que rehacer nada de eso".
- **`registro/js/config.js`**: el único archivo que hay que tocar para
  desplegar el sitio de un evento puntual (URL del backend y, opcional,
  el ID del evento). Ver la sección de checklist más abajo.

## Qué NO incluye (queda para semanas siguientes)

- Envío real de correos (Semana 4) — el registro ya deja creadas las
  notificaciones en estado `PENDIENTE` en la base de datos (esto lo hace
  el backend desde la Semana 1), pero todavía no hay nada que las envíe.
- Hosting/dominio definitivos (Semana 4-5) — hoy corre en local.
- Personalización visual por evento (colores, logo, copy de marca) — el
  diseño actual es neutro a propósito, porque el sistema cotizado es
  genérico para cualquier congreso, no específico de Shineray.

## Cómo se probó

Se levantó Postgres local, se corrió la migración y el seed del admin, se
sirvió `backend/`, `admin/` y `registro/` juntos, y se probó con un
navegador real (Chromium vía Playwright) el flujo completo:

1. Crear un evento desde `admin/` (panel administrativo).
2. Entrar a `registro/` sin configurar `EVENTO_ID` — el sitio detectó y
   mostró automáticamente el evento recién creado.
3. Completar el formulario con una cédula ecuatoriana válida → pantalla
   de confirmación con el correo ingresado.
4. Repetir el registro con la misma cédula → la API lo rechaza y el sitio
   muestra el mensaje de error correspondiente.

Sin errores de consola en ningún paso. El entorno de prueba (servidor,
base de datos, `.env`) se limpió después — no queda nada corriendo.

## Documentos relacionados

- [`ESTADO_ACTUAL.md`](./ESTADO_ACTUAL.md)
- [`PROPUESTA_OFRECIDA.md`](./PROPUESTA_OFRECIDA.md)
- [`COMPARATIVA_Y_PLAN.md`](./COMPARATIVA_Y_PLAN.md)
- [`PENDIENTES_CLIENTE.md`](./PENDIENTES_CLIENTE.md) — todo lo que falta
  decidir, configurar o contratar para poder desplegar esto de verdad.
