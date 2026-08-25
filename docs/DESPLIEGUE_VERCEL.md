# Despliegue en Vercel

## Los despliegues automáticos están APAGADOS

Cada proyecto tiene un `vercel.json` con:

```json
{ "git": { "deploymentEnabled": false } }
```

Eso corta el despliegue automático desde git: **ningún push, a ninguna
rama, dispara un build**. Está en el repo a propósito y no en el panel de
Vercel, para que quede versionado y no dependa de que alguien recuerde
configurarlo proyecto por proyecto.

Los tres archivos: `registro/vercel.json`, `admin/vercel.json` y
`backend/vercel.json`.

### Entonces, ¿cómo se despliega?

De dos maneras, ambas a propósito:

1. **Botón Redeploy** — Vercel → proyecto → Deployments → elegir el commit
   → "..." → Redeploy.
2. **Deploy Hook** — Settings → Git → Deploy Hooks. Crea una URL por
   proyecto y rama; se dispara con `curl -X POST <url>`. Sirve para
   automatizar el despliegue desde otro lado cuando se quiera.

### Para volver a activar el despliegue automático

Cambiar `deploymentEnabled` a `true` (o borrar el bloque `git`) en el
`vercel.json` del proyecto en cuestión. Ojo: ese cambio no se aplica solo
—justamente porque el automático está apagado—, hay que desplegar una vez
a mano para que Vercel lea el archivo nuevo.


> Última actualización: 2026-08-24. **Estado: funcionando en
> producción, probado de punta a punta.** Este documento describe cómo
> quedó configurado, para quien retome el trabajo después.

## URLs

| Proyecto | Qué sirve | URL |
|---|---|---|
| `atodoterreno` | Sitio público (pasaporte de registro) — esto es lo que ve el cliente | **https://atodoterreno.vercel.app** |
| `rideexperience-admin` | Panel administrativo | **https://rideexperience-admin.vercel.app** |
| `rideexperience-api` | Backend / API | https://rideexperience-api.vercel.app |

Los tres están en la cuenta de Vercel del usuario, enlazados al repo de
GitHub (`Jaywrkr/RIDEEXPERIENCE`), rama `claude/las-tanusas-landing-8ttqff`
(rama por defecto del repo — no existe `main`). **Cada push a esa rama
redespliega los tres solos.**

Nota: también existe el proyecto `rideexperience` (rootDirectory = raíz
del repo), que sirve el pasaporte **viejo** con código de acceso — ya no
es el sistema en uso, ver `PROXIMAS_FASES.md` para la decisión
pendiente sobre qué hacer con él.

## Configuración de cada proyecto

### `rideexperience-api`

- Root Directory: `backend`.
- Base de datos: Postgres (Neon) conectada vía integración de Vercel
  Storage. Variables `DATABASE_URL` y `DATABASE_URL_UNPOOLED` inyectadas
  automáticamente por esa integración.
- `JWT_SECRET`: configurado manualmente en Environment Variables.
- `backend/vercel.json`:
  - `"framework": null` — **importante, no sacar esto**. Vercel
    detecta el proyecto como "nestjs" automáticamente por los paquetes
    de `package.json`, y con ese preset activado el catch-all
    `api/[...proxy].ts` no recibe correctamente las rutas con más de
    un segmento (`/api/auth/login`, `/api/eventos/:id`, etc.) ni los
    preflight `OPTIONS` de CORS. Forzar `framework: null` lo resuelve.
  - `"outputDirectory": "public"` — sin preset de framework, Vercel
    espera una carpeta de salida estática; `backend/public/` existe
    vacía solo para satisfacer ese chequeo (el proyecto es 100% API,
    no sirve nada estático de ahí).
  - `"rewrites"`: fuerza `/api/(.*)` → `/api/[...proxy]` explícitamente,
    necesario por el mismo motivo de arriba.
  - `"headers"`: agrega `Access-Control-Allow-*` a las respuestas de
    `/api/*` — refuerzo de CORS a nivel de Vercel, además del
    `enableCors()` que ya hace Nest en `api/[...proxy].ts`.
  - `"crons"`: dispara `GET /api/notificaciones/cron` una vez al día
    (el cron interno de `@nestjs/schedule` no persiste en serverless).
- `package.json` → script `vercel-build`: corre
  `prisma generate && prisma migrate deploy && nest build` — las
  migraciones de base de datos se aplican solas en cada deploy, no hay
  que correrlas a mano.

### `rideexperience-admin` y `atodoterreno`

- Sitios estáticos puros (HTML/CSS/JS, sin build). Root Directory
  `admin/` y `registro/` respectivamente.
- `admin/js/api.js` y `registro/js/config.js` tienen hardcodeada
  `https://rideexperience-api.vercel.app/api` como `API_BASE_URL` por
  defecto.

## Cómo se creó (para referencia, ya no hace falta repetirlo)

1. `create_git_project` (Vercel MCP) por cada uno de los 3 proyectos,
   apuntando al repo y root directory correspondiente.
2. Conectar Postgres (Neon) al proyecto `rideexperience-api` desde
   Vercel → Storage → Create Database → Connect.
3. Agregar `JWT_SECRET` a mano en Environment Variables.
4. Redeploy → la migración corrió sola (gracias al `vercel-build`
   script) y creó las tablas.
5. Crear el primer admin: como esta sesión no tiene salida de red hacia
   bases de datos externas, se generó el hash bcrypt localmente y se
   insertó con un `INSERT` manual desde el editor SQL de Neon.
6. Ajustar CORS (`framework: null` + `rewrites` + `headers` en
   `backend/vercel.json`) hasta que el login del panel funcionara desde
   el navegador — varias iteraciones, documentadas en el historial de
   commits de `backend/vercel.json`.
7. Reemplazar el contenido de `atodoterreno` (Root Directory) para que
   sirviera `registro/` en vez de la raíz del repo — un solo campo en
   Settings → General → Root Directory.

## Documentos relacionados

- [`ESTADO_ACTUAL.md`](./ESTADO_ACTUAL.md) — foto completa del repo.
- [`PROXIMAS_FASES.md`](./PROXIMAS_FASES.md) — qué sigue.
- [`PENDIENTES_CLIENTE.md`](./PENDIENTES_CLIENTE.md) — checklist para
  el usuario.
