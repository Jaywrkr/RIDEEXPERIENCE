# Despliegue de prueba en Vercel

> Última actualización: 2026-08-24. Esto reemplaza la necesidad de correr
> todo en tu máquina (ver `GUIA_PRUEBAS_LOCAL.md`, que sigue sirviendo si
> alguna vez preferís lo local) — ahora hay URLs reales que podés abrir
> desde cualquier navegador.

## Qué se desplegó

Se crearon 3 proyectos nuevos en tu cuenta de Vercel (misma cuenta donde
ya estaban `rideexperience` y `atodoterreno` — esos son apps distintas,
el pasaporte de Las Tanusas y el deck de venta de Shineray; esto es
aparte), los tres enlazados al repo de GitHub y apuntando a la rama
`claude/las-tanusas-landing-8ttqff`, así que **cada push a esa rama los
redespliega solo**, sin que tengas que hacer nada:

| Proyecto | Qué sirve | URL |
|---|---|---|
| `rideexperience-api` | Backend (`backend/`), como función serverless | https://rideexperience-api.vercel.app |
| `rideexperience-admin` | Panel administrativo (`admin/`) | https://rideexperience-admin.vercel.app |
| `rideexperience-registro` | Sitio público de registro (`registro/`) | https://rideexperience-registro.vercel.app |

Los sitios `admin` y `registro` ya están configurados para hablar con
`rideexperience-api.vercel.app` (no hace falta tocar nada ahí).

## Estado ahora mismo

Los tres compilaron y están **arriba**, pero el backend **todavía no
funciona** — devuelve error 500 en cualquier ruta, incluidas las
públicas, porque le falta configuración que solo se puede poner desde el
dashboard de Vercel (no tengo un botón para hacerlo yo desde acá). Lo
confirmé revisando los logs reales del deploy: el error es
`Configuration key "JWT_SECRET" does not exist` — ni siquiera llegó a
intentar conectarse a una base de datos, porque esa variable falta antes.

## Lo que tenés que hacer vos (una sola vez, ~5 minutos, sin instalar nada)

Todo esto es en **vercel.com**, desde el navegador:

1. Entrá al proyecto **`rideexperience-api`** → pestaña **Storage**.
2. **Create Database → Postgres** (plan gratis) → **Connect** al proyecto
   `rideexperience-api`. Esto agrega automáticamente varias variables de
   entorno (`POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc.) — no hace falta
   copiarlas a mano.
3. Andá a **Settings → Environment Variables** del mismo proyecto y
   agregá dos variables más:
   - `DATABASE_URL` → pegá ahí el mismo valor que tiene
     `POSTGRES_PRISMA_URL` (la que Vercel acaba de crear en el paso 2;
     copiala de esa fila y pegala en esta nueva).
   - `JWT_SECRET` → cualquier cadena larga inventada (por ejemplo, mové
     el mouse sobre el teclado un rato y pegá eso).
4. Pestaña **Deployments** → en el deploy más reciente, menú `···` →
   **Redeploy**. Esto hace que la función arranque de nuevo, ahora con
   las variables ya configuradas.

Después de eso, avisame acá en el chat ("ya configuré las variables") y
yo desde esta sesión:
- Reviso los logs para confirmar que ya no tira el error de `JWT_SECRET`.
- Intento correr la migración de la base de datos (crea las tablas) y el
  seed del primer usuario admin por vos, pasándole la cadena de conexión
  que copiaste — sin que tengas que instalar nada. Si por algún motivo
  esta sesión no logra conectarse a tu base desde acá, te paso el único
  comando que habría que correr, por si alguien con Node instalado
  puede hacerlo en tu lugar.

## Notificaciones de correo en este deploy

El cron interno (`@nestjs/schedule`, cada minuto) **no aplica en
serverless** — no hay proceso de fondo entre pedidos. Para este deploy
de prueba dejé configurado un Vercel Cron diario
(`backend/vercel.json`) que llama a `GET /api/notificaciones/cron`. Para
probarlo sin esperar un día entero, se puede llamar esa misma ruta a
mano (con `CRON_SECRET` sin configurar, no pide token) o usar
`POST /api/notificaciones/procesar` con el token de admin — te lo
muestro cuando lleguemos a esa parte de la prueba.

Sin `RESEND_API_KEY` configurada (variable opcional, no es parte de los
4 pasos de arriba), los correos se simulan y quedan solo en los logs de
Vercel — no hace falta para probar el resto del flujo.

## Documentos relacionados

- [`PENDIENTES_CLIENTE.md`](./PENDIENTES_CLIENTE.md) — checklist completo
  (esto es la versión detallada de los primeros ítems ahí).
- [`GUIA_PRUEBAS_LOCAL.md`](./GUIA_PRUEBAS_LOCAL.md) — alternativa 100%
  local, por si en algún momento la preferís.
- [`SEMANA_4.md`](./SEMANA_4.md) — cómo funcionan las notificaciones.
