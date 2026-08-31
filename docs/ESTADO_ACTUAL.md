# Estado actual del repositorio (RIDEEXPERIENCE)

> Última actualización: 2026-08-31. **Producción está al día**: los tres
> proyectos corren el commit `d1556c6` ("Merge pull request #30"),
> desplegados a mano con Deploy Hooks el 2026-08-31. La migración que
> retira la cédula ya se aplicó en ese despliegue. **Los correos ya
> funcionan de verdad**: dominio `atodoterrenoec.com` comprado y
> verificado en Resend, probado con un registro real (correo de
> confirmación entregado con logo y sello) — ver el detalle en
> "Backend / API". Lo anterior sigue
> vigente. Este documento existe para que
> cualquier sesión nueva (de IA o de persona) pueda retomar el trabajo sin
> depender del historial de chat anterior. **Reemplaza la versión del
> 2026-08-27**: desde entonces se agregó a `admin/` el botón para
> eliminar asistentes (con confirmación), se rediseñó la pantalla final
> de confirmación del pasaporte y la bienvenida de `registro/`, y se
> optimizó el peso de fuentes e imágenes sin tocar nada visual (ver
> [«Peso de página»](#peso-de-página-fuentes-en-woff2-imágenes-en-webp-2026-08-28)
> más abajo), y se arregló la suite e2e (`tests/e2e.py` le faltaba tildar
> el checkbox de consentimiento — el sitio nunca estuvo roto, ver nota en
> «Cómo correr las pruebas»). Vuelve a estar 43/43 en verde.

## Qué es esto

Un pasaporte digital de registro para **A Todo Terreno**, la Convención
Nacional Shineray 2026 (25–27 de septiembre). La gente llega escaneando un
QR desde el teléfono, "abre" un pasaporte, llena tres datos y sella su
lugar. Hay un panel administrativo aparte para el equipo organizador.

## URLs en producción

| Qué es | URL |
|---|---|
| **Sitio público** (el pasaporte, lo que ve quien escanea el QR) | **https://atodoterreno.vercel.app** |
| Sitio público, dominio propio (mismo sitio, agregado 2026-08-31) | **https://atodoterrenoec.com** |
| Panel administrativo | **https://rideexperience-admin.vercel.app** |
| Backend / API | https://rideexperience-api.vercel.app |

El QR ya enviado sigue apuntando a `atodoterreno.vercel.app` — no hace
falta reimprimir ni reenviar nada, las dos URLs sirven el mismo
deployment del proyecto `atodoterreno`.

Rama por defecto del repo: **`claude/las-tanusas-landing-8ttqff`**. No
existe `main`.

## ✅ Los despliegues automáticos están apagados

Cada uno de los tres proyectos (`atodoterreno`, `rideexperience-admin`,
`rideexperience-api`) tiene un `vercel.json` con
`{ "git": { "deploymentEnabled": false } }`. **Ningún push, en ninguna
rama, dispara un build.** Mergear código a la rama por defecto ya NO lo
saca a producción por sí solo.

Para que un cambio llegue a producción hace falta un paso manual después
del merge: disparar el **Deploy Hook** `manual` de cada proyecto (una URL
distinta por proyecto, ya creadas). El botón "Redeploy" **no** sirve para
esto: reconstruye el commit viejo, no la punta de la rama. Ver
[`DESPLIEGUE_VERCEL.md`](./DESPLIEGUE_VERCEL.md) y
[`PENDIENTES_CLIENTE.md`](./PENDIENTES_CLIENTE.md#2-los-despliegues-automáticos-ya-están-apagados-).

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

- Cada fila de la tabla tiene un botón **Eliminar** (`admin/js/dashboard.js`)
  que abre un `<dialog>` de confirmación (`admin/dashboard.html`) antes de
  borrar — no hay borrado directo desde la tabla. Confirmar llama a
  `Api.eliminarAsistente` (`admin/js/api.js`), que pega contra
  `DELETE /api/eventos/:eventoId/asistentes/:asistenteId`.

### `backend/` — API (NestJS + Prisma + PostgreSQL)

Desplegado como función serverless (`backend/api/[...proxy].ts`).

- Auth JWT para el panel (`POST /api/auth/login`).
- CRUD de eventos.
- Registro público de asistentes (`POST /api/eventos/:id/asistentes`).
- Panel administrativo: listar, ver, check-in y **eliminar** asistentes
  (`backend/src/asistentes/asistentes.controller.ts` +
  `asistentes.service.ts`). Borrar un asistente elimina en cascada sus
  notificaciones (`onDelete: Cascade` en `Notificacion.asistente`, ver
  `schema.prisma`) — no hace falta borrarlas aparte.
- Notificaciones por correo vía Resend — **funciona, en producción,
  probado de punta a punta (2026-08-31)**. Dominio propio
  `atodoterrenoec.com` (comprado en Vercel, conectado como dominio
  adicional de `atodoterreno` — `atodoterreno.vercel.app` sigue activo,
  el QR ya enviado no se ve afectado), verificado en Resend, y
  `RESEND_API_KEY` + `RESEND_FROM_EMAIL` + `REGISTRO_SITIO_URL` cargadas
  en `rideexperience-api`. Falta cargar `fechaAvisoPrevio` /
  `fechaAvisoFinal` del evento desde el panel para que los otros dos
  avisos (no solo la confirmación) tengan cuándo dispararse.

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
**43 comprobaciones, todas en verde** al cierre de esta sesión (2026-08-28).

Requiere `pip install playwright`. El entorno de estas sesiones ya trae
Chromium en `/opt/pw-browsers/chromium`.

> Nota: la red de las sesiones de Claude **bloquea**
> `rideexperience-api.vercel.app`, por eso las pruebas corren contra el
> backend local. Si se cambian las reglas de validación del backend, hay
> que cambiarlas en `tests/mockapi.py` **y** en `registro/js/validacion.js`.

**Arreglo 2026-08-28: la suite se había quedado desactualizada, no el
sitio.** El commit `066958d` (2026-08-26) agregó el checkbox obligatorio
de consentimiento de datos al paso 2, pero nunca actualizó el helper
`llenar()` de `tests/e2e.py` para tildarlo. Sin el checkbox tildado,
`goNext()` bloquea el avance (correcto — es exactamente lo que tiene que
pasar), así que `t_flujo_feliz` quedaba colgada 30s esperando `.btn-sellar`
y tiraba una excepción; como todas las pruebas comparten la misma página
de Playwright, el borrador a medio llenar que había quedado en
`sessionStorage` contaminaba las pruebas siguientes y arrastraba 10 de
las 36 comprobaciones a rojo en cadena. Se verificó a mano con Playwright
que el sitio real funciona perfecto tildando el checkbox (cero errores
de JS) antes de tocar nada — el bug estaba solo en `llenar()`, que ahora
hace `page.check("#consentimiento")`. Vuelve a estar 43/43 en verde.

## Peso de página: fuentes en `.woff2`, imágenes en `.webp` (2026-08-28)

Pase de optimización que no toca nada visual ni de interacción — solo el
formato en que viajan los archivos. Cambios:

- **Fuentes**: `Discota-CondensedRough.otf` y `DINPro-Black.otf` se
  reempaquetan como `.woff2` (mismos glifos, contenedor con compresión
  brotli en vez de sin comprimir) — 57% y 71% más liviano cada una. El
  `.otf` original queda como segunda fuente en `src` de `@font-face` para
  el puñado de navegadores sin soporte woff2; nunca se sirve salvo ahí.
  En `registro/assets/fonts/` y `admin/assets/fonts/`.
- **Imágenes**: las PNG puramente decorativas (dunas de la bienvenida,
  wordmark, logo negro, texturas de fondo, la máscara de `ruta.png`) se
  reconvierten a `.webp` **sin pérdida** — se verificó píxel a píxel que
  el `.webp` decodifica exactamente igual que el `.png` original antes de
  reemplazar cada referencia. 52%–66% más livianas; las dos dunas de la
  bienvenida (las más pesadas, 2.3 MB y 0.8 MB) bajan a 900 KB y 330 KB.
- **Lo que NO se tocó, a propósito**:
  - `sello-aventura-garantizada.png` y `shineray-shm-logo-blanco.png` (en
    `registro/assets/brand/`) siguen en PNG: `backend/src/notificaciones/
    templates/correos.ts` los referencia por nombre de archivo exacto vía
    URL absoluta para incrustarlos en los correos, y el soporte de webp
    en clientes de correo (Outlook de escritorio, sobre todo) es mucho
    menos confiable que en navegadores. La copia de
    `shineray-shm-logo-blanco.png` en `admin/assets/` es independiente
    (solo la usa la UI del panel) y sí se convirtió.
  - `shineray-shm-logo.png` (la variante roja, prohibida — ver regla más
    arriba) no se tocó: es un artefacto documentado a propósito, no vale
    la pena el riesgo de romper la referencia de esta nota por 14 KB.
  - `textura-arena.jpg` y `og-image.png` quedan igual: la primera ya es
    JPEG bien comprimido (no hay una versión sin pérdida más chica que
    ganarle), y la segunda solo la leen crawlers de redes sociales para
    la vista previa del link, donde conviene no arriesgar compatibilidad.
  - Se borraron `shineray-fondo-blanco.png` y `shineray-fondo-negro.png`
    de `registro/assets/brand/`: no los referenciaba nada en el sitio, el
    panel, el backend ni la documentación — peso muerto puro (162 KB).

## ⚠️ Reglas permanentes del cliente (no cambiar nunca sin que lo pida)

- **La fecha del evento es el 25 de septiembre de 2026, no el 27.** Fuente
  única: `EVENT_DATE` en `registro/js/countdown.js`
  (`2026-09-25T09:00:00-05:00`). Cualquier otro lugar que necesite "la
  fecha del evento" debe importar esa constante, no escribirla de nuevo.
  (El rango ENTRADA/SALIDA de la hoja de visado y el fin del evento en el
  `.ics` del calendario sí van del 25 al 27 a propósito: es un rango de
  varios días, no "la" fecha.)
- **Nunca usar el logo de Shineray en rojo** (`shineray-shm-logo.png`) en
  ningún lugar del sitio ni del panel. Usar la variante negra
  (`shineray-shm-logo-negro.webp` en `registro/`) sobre fondos claros y
  la blanca (`shineray-shm-logo-blanco.png` en `registro/` — sigue en PNG
  a propósito, ver nota de rendimiento más abajo; `.webp` en
  `admin/assets/`) sobre fondos oscuros. Mismo criterio en `admin/assets/`.

## Tipografía: el diseño usa solo estas dos fuentes, a propósito

**Corrección (2026-08-26): esto NO es un pendiente.** Una sesión anterior
asumió por su cuenta que "todo en negrita" era un problema a resolver y
le pidió al cliente un peso DIN Pro Regular/Medium que nadie había
pedido. El cliente confirmó que el diseño está definido con exactamente
estas dos fuentes, ninguna más:

- `Discota-CondensedRough` (titulares/display).
- `DINPro-Black` (todo lo demás, peso 900).

No pedir ni sugerir un tercer peso de fuente en sesiones futuras.

Los dos `.otf` que el cliente reenvió dos veces (creyendo que se le
pedía algo distinto) son duplicados idénticos —confirmado por hash MD5 y
por los metadatos internos del propio archivo ("DIN Pro", estilo
"Black")— de los que ya vive en `registro/assets/fonts/`. Quedan sueltos
en el repo, sin usar, como restos de limpieza:

- `assets/fonts/x` — archivo vacío, de un commit manual accidental.
- `assets/fonts/Discota-CondensedRough (1).otf` y
  `assets/fonts/dinpro_black (1).otf` — duplicados idénticos de los que ya
  viven en `registro/assets/fonts/`.

Ver [`PENDIENTES_CLIENTE.md`](./PENDIENTES_CLIENTE.md) para el detalle de
si se pueden borrar.

## Decisiones de diseño que conviene no deshacer sin querer

- **La cédula se retiró a propósito** (2026-08-25). El correo pasó a ser
  la clave natural: es lo único que impide que la misma persona se
  inscriba dos veces. La restricción única `(eventoId, correo)` en
  `schema.prisma` es esa protección.
- **"A TODO TERRENO" es una imagen, no texto.** Es el lockup real de
  marca (`wordmark-atodoterreno.webp`). Componerlo con la fuente da un
  peso y un kerning distintos.
- **El audio arranca siempre con sonido, sin preguntar** (cambió el
  2026-08-27; antes ofrecía "entrar con sonido" / "entrar en silencio"
  como dos botones separados). El único botón "ENTRAR →" hace de gesto
  de permiso del navegador para reproducir audio.
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
