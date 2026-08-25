# Estado actual del repositorio (RIDEEXPERIENCE)

> Última actualización: 2026-08-25. Este documento existe para que
> cualquier sesión nueva (de IA o de persona) pueda retomar el trabajo sin
> depender del historial de chat anterior. **Reemplaza la versión del
> 2026-08-24**, que ya no describe el sistema: desde entonces se retiró la
> cédula, se rehizo el diseño con la marca real y se agregó una suite de
> pruebas.

## Qué es esto

Un pasaporte digital de registro para **A Todo Terreno**, la Convención
Nacional Shineray 2026 (25–27 de septiembre). La gente llega escaneando un
QR desde el teléfono, "abre" un pasaporte, llena tres datos y sella su
lugar. Hay un panel administrativo aparte para el equipo organizador.

## URLs en producción

| Qué es | URL |
|---|---|
| **Sitio público** (el pasaporte, lo que ve quien escanea el QR) | **https://atodoterreno.vercel.app** |
| Panel administrativo | **https://rideexperience-admin.vercel.app** |
| Backend / API | https://rideexperience-api.vercel.app |

Rama por defecto del repo: **`claude/las-tanusas-landing-8ttqff`**. No
existe `main`.

## ⚠️ Cada push despliega. No hay freno puesto.

Verificado contra la API de Vercel el 2026-08-25:

- Un push a **cualquier rama** crea un *preview deployment*.
- Un merge a la rama por defecto crea un **deploy a producción real**.

Se documentó como pendiente configurar el **Ignored Build Step** (`exit 0`
en Settings → Git de cada proyecto) para frenarlo, pero **no se aplicó**.
Mientras siga así, hay que asumir que todo lo que se mergea sale al aire.

## Proyectos de Vercel

Tres activos, cada uno con su `rootDirectory`:

| Proyecto | rootDirectory |
|---|---|
| `atodoterreno` | `registro/` |
| `rideexperience-admin` | `admin/` |
| `rideexperience-api` | `backend/` |

Y dos **pausados** el 2026-08-24 (reversible, no se borró nada):
`rideexperience` (el pasaporte viejo de código de acceso, que todavía vive
en la raíz del repo) y `rideexperience-registro` (duplicado de
`atodoterreno`, nunca se usó).

Base de datos: Postgres (Neon) conectado a `rideexperience-api`. Las
migraciones de Prisma corren solas en cada deploy (`vercel-build`).

## Qué contiene el repo

### `registro/` — el pasaporte público

Sitio estático, sin build step, JavaScript con módulos ES nativos.

- `index.html` — la página entera (bienvenida, pasaporte de 3 pasos,
  confirmación, cuenta atrás).
- `css/style.css` — todo el estilo. Tiene un sistema de tokens al
  principio: paleta, escala tipográfica, tracking, interlineado y curvas
  de animación.
- `js/` — un módulo por responsabilidad:
  - `main.js` arranca todo.
  - `welcome.js` — la bienvenida y su disipación.
  - `motion.js` — coreografía de entrada, parallax, ondas de clic.
  - `ambiente.js` — **todo el audio**, sintetizado con Web Audio (0 KB en
    archivos): viento de tres capas y los sonidos de interfaz.
  - `passport.js` — el flujo de 3 pasos, el sello y el envío.
  - `validacion.js` — validación en el navegador, espejo del backend.
  - `api.js`, `config.js`, `countdown.js`, `clues.js`, `reveal.js`.
- `assets/brand/` — logo, wordmark, sello, montañas, textura de arena.
- `assets/fonts/` — Discota-CondensedRough y DINPro-Black.
- `sw.js` — service worker.
- `tests/` — la suite end-to-end (ver más abajo).

### `admin/` — panel administrativo

Sitio estático también. Login con JWT, edición del evento y tabla de
inscritos con cuatro métricas. Tiene **su propia copia** de las fuentes y
el logo en `admin/assets/`: se despliega como raíz propia en Vercel y no
puede leer los archivos de `registro/`.

### `backend/` — API (NestJS + Prisma + PostgreSQL)

Desplegado como función serverless (`backend/api/[...proxy].ts`).

- Auth JWT para el panel (`POST /api/auth/login`).
- CRUD de eventos.
- Registro público de asistentes (`POST /api/eventos/:id/asistentes`).
- Notificaciones por correo vía Resend — **el mecanismo funciona pero los
  correos NO se envían**: falta cargar `RESEND_API_KEY`. Sin ella, el
  sistema registra gente normal y solo loguea los correos.

### `shineray-deck/` — deck de venta

Presentación de 10 slides para pitchear el concepto. No tiene relación
funcional con el sistema; se mantiene como pieza comercial.

### Raíz del repo — pasaporte VIEJO

`index.html`, `css/`, `js/`, `api/`, `lib/`, `db/` son el sistema
**anterior** (pasaporte con código de acceso pre-generado). Ya no se usa,
su proyecto de Vercel está pausado, pero el código sigue ahí. Borrarlo
requiere confirmación explícita: su base puede tener inscripciones reales.

## Cómo correr las pruebas

```bash
cd registro
python3 tests/e2e.py          # todo
python3 tests/e2e.py -k borrador   # solo un grupo
```

Levanta el sitio y un backend de pruebas (`tests/mockapi.py`) que replica
el contrato real del NestJS, y maneja un navegador de punta a punta.
**43 comprobaciones, todas en verde** al cierre de esta sesión.

Requiere `pip install playwright`. El entorno de estas sesiones ya trae
Chromium en `/opt/pw-browsers/chromium`.

> Nota: la red de las sesiones de Claude **bloquea**
> `rideexperience-api.vercel.app`, por eso las pruebas corren contra el
> backend local. Si se cambian las reglas de validación del backend, hay
> que cambiarlas en `tests/mockapi.py` **y** en `registro/js/validacion.js`.

## Decisiones de diseño que conviene no deshacer sin querer

- **La cédula se retiró a propósito** (2026-08-25). El correo pasó a ser
  la clave natural: es lo único que impide que la misma persona se
  inscriba dos veces. La restricción única `(eventoId, correo)` en
  `schema.prisma` es esa protección.
- **"A TODO TERRENO" es una imagen, no texto.** Es el lockup real de
  marca (`wordmark-atodoterreno.png`). Componerlo con la fuente da un peso
  y un kerning distintos.
- **El audio arranca siempre en silencio.** La bienvenida ofrece "entrar
  con sonido" porque el navegador solo permite reproducir audio dentro de
  un gesto del usuario.
- **El rojo de marca (#c41e1e) sobre fondo oscuro da 3.18:1**, que falla
  WCAG AA para texto chico. Para eso existe `--rojo-sobre-oscuro`
  (#e84545). No usar el rojo de marca en texto chico sobre oscuro.
- **El marco del pasaporte no debe volver a fijar su altura con
  `aspect-ratio`.** Lo hacía, y cuando la hoja de visado creció, el botón
  de sellar quedó recortado: el formulario no se podía enviar.

## Documentos relacionados

- [`PROXIMAS_FASES.md`](./PROXIMAS_FASES.md) — qué sigue.
- [`PENDIENTES_CLIENTE.md`](./PENDIENTES_CLIENTE.md) — lo que depende de
  cuentas o decisiones tuyas.
- [`DESPLIEGUE_VERCEL.md`](./DESPLIEGUE_VERCEL.md) — configuración del
  despliegue.
- [`GUIA_PRUEBAS_LOCAL.md`](./GUIA_PRUEBAS_LOCAL.md) — correr todo en
  local.
- [`PROPUESTA_OFRECIDA.md`](./PROPUESTA_OFRECIDA.md) — qué se cotizó.
- [`COMPARATIVA_Y_PLAN.md`](./COMPARATIVA_Y_PLAN.md),
  [`SEMANA_3.md`](./SEMANA_3.md), [`SEMANA_4.md`](./SEMANA_4.md) —
  histórico de la construcción.
