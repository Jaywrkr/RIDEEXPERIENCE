# Sitio de registro — A Todo Terreno (Shineray)

Pasaporte digital de inscripción para la Convención Nacional Shineray
2026. La experiencia visual (portada kraft, animación de apertura,
pasaporte con MRZ, sello de confirmación) es la misma que ya vive en
`../index.html` — se copió tal cual desde ahí y se adaptó únicamente el
formulario y el envío final para que quede conectado al backend real
(`../backend/`) en vez del sistema de código de acceso pre-generado.

Sin build step ni dependencias — HTML/CSS/JS plano, PWA instalable
(manifest + service worker).

## Qué cambia respecto al pasaporte original

- **Sin código de acceso**: la portada abre directo a la página de
  datos — el registro es abierto por cédula, no por código pre-asignado.
- **Campos del formulario**: cédula (validada con dígito verificador
  real), nombre completo, teléfono y correo — en vez de
  apellidos/nombres/nacionalidad.
- **Envío**: `POST /api/eventos/:eventoId/asistentes` al backend real
  (`../backend/`), no `/api/validar-codigo`.
- **Confirmación**: no hay estado de "sellos" (eso era del sistema
  viejo) — muestra el correo donde va a llegar el aviso.

## Antes de desplegar

Editar `js/config.js`:
- `API_BASE_URL`: URL pública del backend ya desplegado.
- `EVENTO_ID`: opcional — si se deja vacío, toma automáticamente el
  primer evento que encuentre (este sitio es de un solo evento).

Ver [`../docs/PENDIENTES_CLIENTE.md`](../docs/PENDIENTES_CLIENTE.md) y
[`../docs/DESPLIEGUE_VERCEL.md`](../docs/DESPLIEGUE_VERCEL.md) para el
resto de la configuración (base de datos, variables de entorno, etc.).
