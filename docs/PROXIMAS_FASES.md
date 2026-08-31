# Próximas fases

> Última actualización: 2026-08-31. Ver
> [`ESTADO_ACTUAL.md`](./ESTADO_ACTUAL.md) para la foto completa del repo,
> incluidas las reglas permanentes del cliente (fecha del evento, logo).

## Estado de producción (2026-08-31)

Los tres proyectos están en el commit **`d1556c6`** ("Merge pull request
#30"), desplegados a mano con Deploy Hooks. La rama por defecto y
producción están alineadas: no hay código fusionado esperando salir.

Recordatorio: los deploys automáticos siguen apagados. Para publicar algo
nuevo hay que disparar el Deploy Hook `manual` de cada proyecto — el botón
"Redeploy" reconstruye el commit viejo, no sirve. Ver
[`DESPLIEGUE_VERCEL.md`](./DESPLIEGUE_VERCEL.md).

## Lo primero que debería hacer una sesión nueva

- [ ] **Correr la suite antes de tocar nada**, para partir de un estado
  conocido:
  ```bash
  cd registro && python3 tests/e2e.py
  ```
  Debe dar 43/43. Si no da, eso es lo primero a resolver.

- [ ] **Revisar en qué rama está el trabajo.** El flujo normal es: una
  rama `fase-N-descriptivo` por tanda de cambios, que el usuario mergea a
  mano con un PR. La única excepción fue el 2026-08-26, cuando el usuario
  pidió mergear directamente las 7 ramas de "wow factor" visual
  (`fase-7`…`fase-13`) sin pasar por PR individual — ya está hecho, no
  repetir ese patrón sin que lo pida de nuevo.

## Lo más importante que queda pendiente

- [x] ~~Conseguir un peso de texto de DIN Pro que no sea Black.~~
  **Descartado (2026-08-26): no era un pendiente real.** Una sesión
  anterior asumió por su cuenta que "todo en negrita" era un problema y
  le pidió al cliente un peso Regular/Medium que nadie había pedido. El
  cliente confirmó directamente que el diseño está definido con
  exactamente `Discota-CondensedRough` + `DINPro-Black`, sin un tercer
  peso. **No volver a pedir ni sugerir esto.** (Los `.otf` que el cliente
  reenvió dos veces, confundido por ese pedido, siguen siendo duplicados
  idénticos de los que ya están en el repo — ver el punto de limpieza más
  abajo.)

- [ ] **Limpiar los archivos de fuente duplicados/sueltos** que quedaron
  de los dos reenvíos fallidos: `assets/fonts/x` (vacío, de un commit
  manual), `assets/fonts/Discota-CondensedRough (1).otf` y
  `assets/fonts/dinpro_black (1).otf` (duplicados byte a byte de los que
  ya están en `registro/assets/fonts/`). Confirmar con el cliente antes de
  borrar, por si acaso.

- [x] ~~Frenar los despliegues automáticos.~~ **Resuelto desde el repo**:
  cada proyecto tiene un `vercel.json` con
  `{ "git": { "deploymentEnabled": false } }`, así que ningún push
  dispara un build. Se hizo así en vez de con el "Ignored Build Step" del
  panel para que quede versionado. Para desplegar: botón "Redeploy" o un
  Deploy Hook. Ver [`DESPLIEGUE_VERCEL.md`](./DESPLIEGUE_VERCEL.md).

- [x] ~~Aplicar la migración que quita la cédula.~~ **Ya se aplicó.** La
  migración `backend/prisma/migrations/20260825120000_quitar_cedula/`
  corrió en los despliegues del backend (el `vercel-build` ejecuta
  `prisma migrate deploy` en cada build); el último, del 2026-08-31, ya
  la incluye. La columna y sus datos ya no existen. No volver a avisar
  sobre esto.

## Correos reales (siguen sin enviarse)

- [ ] Crear cuenta en [Resend](https://resend.com) y verificar dominio.
- [ ] Cargar `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en Vercel → proyecto
  `rideexperience-api` → Settings → Environment Variables, y redesplegar.
- [x] ~~Revisar el copy de los 3 correos.~~ **Hecho.** Los tres correos de
  `backend/src/notificaciones/templates/correos.ts` ya están con la voz de
  marca ("¡Ya estás dentro de la aventura A Todo Terreno!", "Falta poco,
  …", "Nos vemos ahí, …"), la paleta del sitio y el sello. Esta nota
  quedó vieja.

## Cierre

- [ ] **Confirmar la fecha real del evento.** Está escrita a mano como
  25–27 de septiembre 2026 en varios sitios: `registro/js/countdown.js`,
  la hoja de visado de `registro/index.html` y el copy. Si cambia, hay que
  tocarlos todos.
- [ ] **Dominio propio** en vez de `*.vercel.app` (opcional, cosmético).
- [ ] **QA en dispositivo real**: el flujo completo desde un teléfono de
  verdad, escaneando el QR real. Importa especialmente porque hay dos
  cosas que solo existen en móvil: la vibración al sellar y la
  "respiración" de las montañas (en escritorio ese lugar lo ocupa el
  parallax).
- [ ] **Probar el sonido con auriculares reales.** Todo el audio se
  calibró midiendo la señal renderizada, no escuchándolo. Los niveles son
  correctos en dB, pero nadie lo ha oído todavía.
- [x] ~~Borrar 2 ramas de GitHub ya fusionadas~~ (verificado 2026-08-27:
  `claude/seo-metadata-jay-jaramillo-4w1p6b` y
  `claude/passport-stamp-notifications-s0vk0a` ya no existen en el
  remoto — se borraron en algún momento fuera de esta sesión).
- [ ] Decidir qué hacer con el **pasaporte viejo** en la raíz del repo
  (`index.html`, `api/`, `lib/`, `db/`). Su proyecto de Vercel ya está
  pausado. Borrar el código requiere confirmación explícita: esa base
  puede tener inscripciones reales de gente que usó un código.

## Ideas evaluadas y no hechas

- ~~Exportar los inscritos a CSV desde el panel~~ — **ya está hecho**
  (verificado 2026-08-27: `admin/js/dashboard.js`, función
  `exportarCsv()`, con botón en el panel). Esta nota quedó vieja.
- **Reemplazar los `datetime-local` del panel** por un selector propio.
  Hoy muestran el formato del idioma del sistema (`09/25/2026` en un
  equipo en inglés), que no se puede forzar desde el sitio. Arreglarlo es
  trabajo real, no un ajuste.
- **El emoji 🤘** de la confirmación se retiró al reescribir el titular en
  dos alturas. Era el único elemento a color fuera de la paleta.

## Ya resuelto

- ✅ Backend, base de datos, autenticación, panel y sitio público, los
  tres desplegados y probados en producción.
- ✅ Suite end-to-end de 43 comprobaciones (`registro/tests/`).
- ✅ Cédula retirada de todo el stack; el correo es la clave natural.
- ✅ Identidad real aplicada: wordmark oficial, paleta, dos fuentes de
  marca, sello, montañas y textura de arena.
- ✅ Capa de movimiento: coreografía de entrada, parallax, ondas.
- ✅ Audio sintetizado: viento de tres capas y sonidos de interacción.
- ✅ Panel administrativo con la marca y métricas reales.
- ✅ Contraste WCAG AA, objetivos táctiles de 44px, `alt` en toda imagen y
  `label` en todo campo.
- ✅ Service worker arreglado: la caché no se versionaba, así que los
  visitantes recurrentes habrían seguido viendo el sitio viejo.
- ✅ **7 fases de "wow factor" visual** mergeadas a la rama por defecto
  (2026-08-26): tilt de giroscopio, mecanografiado del MRZ, sello
  holográfico, rastro de arena en la tapa, parallax de montañas, ondas de
  clic y más. Probadas juntas de punta a punta, sin errores de consola.
- ✅ **Logo rojo de Shineray reemplazado en todo el sitio** por las
  variantes negra/blanca según el fondo (`registro/index.html`,
  `admin/dashboard.html`, `admin/index.html`).
- ✅ **Pantalla de bienvenida rehecha** (2026-08-26): se quitaron las 5
  masas de polvo animadas en bucle infinito (`filter: blur()` continuo,
  la causa de la lentitud reportada) y se reemplazaron por el mismo fondo
  fijo de textura de arena + dunas de semitono que usa la tapa del
  pasaporte, replicando el gráfico de referencia del cliente.
