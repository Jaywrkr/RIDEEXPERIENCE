# Próximas fases

> Última actualización: 2026-08-24. El sistema ya está en producción y
> probado de punta a punta por el usuario (login, creación de evento,
> registro real con cédula desde el pasaporte, asistente visible en el
> panel). Esto es lo que sigue.

## Ahora mismo / próxima sesión

- [ ] **Detalles de UI pendientes** — el usuario mencionó que hay
  algunos ajustes visuales por resolver, sin especificar cuáles
  todavía. Preguntarle apenas retome la sesión qué es exactamente lo
  que quiere cambiar antes de tocar nada a ciegas.

## Notificaciones de correo reales (Semana 4, todavía simuladas)

- [ ] Crear cuenta en [Resend](https://resend.com) (o confirmar si se
  reusa la que ya usa `lib/mailer.js` del pasaporte viejo — mismo
  proveedor, evita duplicar cuentas).
- [ ] Verificar dominio de envío en Resend (o usar su dominio de
  pruebas mientras tanto) y generar una API key.
- [ ] Cargar `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en
  **Environment Variables** del proyecto `rideexperience-api` en
  Vercel, y redesplegar. Sin esto, el sistema sigue registrando gente
  normal, pero los correos solo quedan logueados, no se mandan.
- [ ] Revisar/ajustar el copy de los 3 correos
  (`backend/src/notificaciones/templates/correos.ts`) — hoy es
  genérico, se puede llevar al tono de marca de Shineray si se quiere
  (hay copy ya validado para esto en `shineray-deck/index.html`, slide
  "El mensaje real").

## Decisión pendiente: el pasaporte viejo (código de acceso)

- [ ] Decidir qué hacer con `index.html` + `api/` + `lib/` + `db/` en
  la raíz del repo y con el proyecto de Vercel `rideexperience.vercel.app`,
  que todavía los sirve. Ya no es el sistema que usa el cliente (lo
  reemplazó `registro/` en `atodoterreno.vercel.app`), pero sigue
  activo. Opciones:
  - Dejarlo como está (no molesta, pero es codigo/infra sin uso real).
  - Pausar el proyecto de Vercel (`pause_project`, reversible) para que
    no siga corriendo builds/tráfico.
  - Borrar el código de la raíz del repo (requiere confirmación
    explícita — tiene su propia base de datos con posibles registros
    reales de gente que ya se inscribió con código).

## Cierre / producción definitiva

- [ ] **Borrar 2 ramas de GitHub** ya fusionadas y seguras de eliminar
  (el token de esta sesión no tiene permiso, hay que hacerlo a mano):
  `claude/seo-metadata-jay-jaramillo-4w1p6b` y
  `claude/passport-stamp-notifications-s0vk0a`.
- [ ] **Dominio propio** en vez de `*.vercel.app` (opcional, cosmético
  — hay que comprarlo y configurarlo en el proyecto `atodoterreno`).
- [ ] **QA final en dispositivo real**: probar el flujo completo desde
  un celular de verdad, incluyendo escanear el QR real (cuando exista)
  y confirmar que abre directo el pasaporte.
- [ ] Confirmar con el cliente la fecha real del evento — hoy está
  hardcodeada como 25-27 de septiembre 2026 en varios lugares
  (`registro/js/countdown.js`, `registro/js/passport.js` fecha de
  expiración, copy del sitio). Si cambia, hay que actualizarla en esos
  archivos.

## Ya resuelto (para referencia)

- ✅ Backend, base de datos, autenticación — Semana 1.
- ✅ Panel administrativo, simplificado a un solo evento.
- ✅ Sitio de registro con el pasaporte visual real, conectado al
  backend.
- ✅ Notificaciones (mecanismo funcionando, falta solo la cuenta de
  Resend real para que salgan de verdad).
- ✅ Los 3 componentes desplegados en Vercel, con CORS, migraciones
  automáticas y admin real ya funcionando — **probado en producción por
  el usuario**.
- ✅ Ramas de trabajo unidas a la rama por defecto del repo.

## Documentos relacionados

- [`ESTADO_ACTUAL.md`](./ESTADO_ACTUAL.md) — foto completa de qué es
  este repo hoy.
- [`PENDIENTES_CLIENTE.md`](./PENDIENTES_CLIENTE.md) — checklist
  detallado (parcialmente superpuesto con este documento).
- [`DESPLIEGUE_VERCEL.md`](./DESPLIEGUE_VERCEL.md) — configuración del
  despliegue.
