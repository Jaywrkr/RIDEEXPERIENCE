# Próximas fases

> Última actualización: 2026-08-25. Ver
> [`ESTADO_ACTUAL.md`](./ESTADO_ACTUAL.md) para la foto completa del repo.

## Lo primero que debería hacer una sesión nueva

- [ ] **Correr la suite antes de tocar nada**, para partir de un estado
  conocido:
  ```bash
  cd registro && python3 tests/e2e.py
  ```
  Debe dar 43/43. Si no da, eso es lo primero a resolver.

- [ ] **Revisar en qué rama está el trabajo.** Al cierre de esta sesión el
  historial iba en ramas por fase (`fase-1-identidad` … `fase-6-admin`),
  encadenadas entre sí, que el usuario mergea a mano con un PR por fase.
  Las fases 1 a 5 **ya están mergeadas y en producción**; la 6 (panel
  administrativo) quedó pusheada esperando PR.

## Lo más importante que queda pendiente

- [ ] **Conseguir un peso de texto de DIN Pro.** Hoy el único tipo
  disponible para texto es **DIN Pro Black, un peso 900**, así que todo el
  texto corrido —del sitio y del panel— se lee como un muro de negritas.
  Se compensó con interlineado y medida de lectura, pero es un parche. Con
  **DIN Pro Regular o Medium** el proyecto entero da un salto inmediato.
  Es el cambio de mayor impacto que queda. Al llegar el archivo: sumarlo a
  `registro/assets/fonts/` y `admin/assets/fonts/`, declarar el
  `@font-face` y apuntar `--font-mono` (sitio) y `--fuente` (panel) al
  peso nuevo, dejando el Black solo para titulares y botones.

- [x] ~~Frenar los despliegues automáticos.~~ **Resuelto desde el repo**:
  cada proyecto tiene un `vercel.json` con
  `{ "git": { "deploymentEnabled": false } }`, así que ningún push
  dispara un build. Se hizo así en vez de con el "Ignored Build Step" del
  panel para que quede versionado. Para desplegar: botón "Redeploy" o un
  Deploy Hook. Ver [`DESPLIEGUE_VERCEL.md`](./DESPLIEGUE_VERCEL.md).

- [ ] **Aplicar la migración que quita la cédula.** El código ya no la
  usa, pero la migración
  `backend/prisma/migrations/20260825120000_quitar_cedula/` **borra la
  columna y sus datos de forma irreversible**. Si hay inscripciones
  previas con cédulas que se necesiten, **exportarlas antes**. Corre sola
  en el próximo deploy del backend.

## Correos reales (siguen sin enviarse)

- [ ] Crear cuenta en [Resend](https://resend.com) y verificar dominio.
- [ ] Cargar `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en Vercel → proyecto
  `rideexperience-api` → Settings → Environment Variables, y redesplegar.
- [ ] Revisar el copy de los 3 correos en
  `backend/src/notificaciones/templates/correos.ts` — sigue siendo
  genérico. Hay copy de marca validado en `shineray-deck/index.html`,
  slide "El mensaje real".

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
- [ ] **Borrar 2 ramas de GitHub** ya fusionadas:
  `claude/seo-metadata-jay-jaramillo-4w1p6b` y
  `claude/passport-stamp-notifications-s0vk0a`.
- [ ] Decidir qué hacer con el **pasaporte viejo** en la raíz del repo
  (`index.html`, `api/`, `lib/`, `db/`). Su proyecto de Vercel ya está
  pausado. Borrar el código requiere confirmación explícita: esa base
  puede tener inscripciones reales de gente que usó un código.

## Ideas evaluadas y no hechas

- **Exportar los inscritos a CSV** desde el panel. Es de valor real para
  el equipo organizador el día del evento y es poco trabajo, pero no se
  pidió, así que no se agregó.
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
