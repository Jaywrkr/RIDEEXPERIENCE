# Sitio de registro — A Todo Terreno (Shineray)

Pasaporte digital de inscripción para la Convención Shineray 2026. Es el
sitio que se abre al escanear el QR de la invitación: una bienvenida, un
pasaporte de tres hojas y el sello final.

Sin build step ni dependencias — HTML/CSS/JS plano con módulos ES nativos,
PWA instalable (manifest + service worker).

## El flujo

1. **Bienvenida** — dunas de arena, un solo botón "ENTRAR →". Siempre
   entra con sonido, sin preguntar: el navegador solo permite reproducir
   audio dentro de un gesto del usuario, así que ese clic hace de permiso.
2. **Tapa del pasaporte** — el wordmark oficial grabado sobre kraft, con
   las montañas de la marca al pie.
3. **Hoja de datos** — nombre, teléfono, correo y el checkbox de
   consentimiento de datos (los cuatro son obligatorios, todos bloquean
   el avance igual si faltan). Se valida al salir de cada campo, no
   mientras se escribe.
4. **Hoja de visado** — resumen con etiquetas bilingües, fechas del viaje
   y el destino tachado como dato clasificado (es sorpresa).
5. **Sello** — cae sobre el papel, vibra el teléfono, el documento se
   disuelve en arena y aparece la confirmación. Unos segundos después
   "llega" flotando el aviso de cuenta regresiva, como una notificación
   real de teléfono (con su propio sonido).

## Estructura

| Archivo | Qué hace |
|---|---|
| `index.html` | La página entera. |
| `css/style.css` | Todo el estilo. Los tokens de diseño (paleta, escala tipográfica, tracking, curvas) están al principio. |
| `js/main.js` | Arranca los módulos. |
| `js/welcome.js` | Bienvenida y su disipación. |
| `js/motion.js` | Coreografía de entrada, parallax, ondas de clic. |
| `js/ambiente.js` | **Todo el audio**, sintetizado con Web Audio. |
| `js/passport.js` | Los 3 pasos, el sello y el envío. |
| `js/validacion.js` | Validación en el navegador, espejo del backend. |
| `js/countdown.js` | Cuenta regresiva hasta el evento (`EVENT_DATE`, fuente única de la fecha). |
| `js/api.js` | Cliente HTTP. |
| `js/config.js` | URL de la API y ID del evento. |
| `assets/brand/` | Logo, wordmark, sello, montañas, arena — casi todo en `.webp` sin pérdida; ver nota de rendimiento más abajo. |
| `assets/fonts/` | Discota-CondensedRough, DINPro-Black, en `.woff2` (con el `.otf` original de respaldo). |
| `tests/` | Suite end-to-end. |

## Pruebas

```bash
python3 tests/e2e.py            # las 43 comprobaciones
python3 tests/e2e.py -k borrador   # solo un grupo
```

Levanta el sitio y un backend de pruebas que replica el contrato real del
NestJS, y maneja un navegador de punta a punta: validación, estados de
error, persistencia real de los datos, navegación y doble envío.

Requiere `pip install playwright`.

> Si cambian las reglas de validación del backend, hay que cambiarlas en
> **dos** lugares más: `js/validacion.js` y `tests/mockapi.py`. Si se
> separan, el formulario rechazaría datos que el servidor acepta, o
> dejaría pasar datos que el servidor va a rechazar igual.

> Si se agrega un campo obligatorio nuevo al paso 2 (como pasó con el
> checkbox de consentimiento, `066958d`), hay que sumarlo también al
> helper `llenar()` de `tests/e2e.py` — si no, `t_flujo_feliz` se cuelga
> esperando `.btn-sellar`, y como todas las pruebas comparten la misma
> página de Playwright, el borrador a medio llenar contamina las
> siguientes y arrastra un puñado de comprobaciones más a rojo en cadena
> (pasó el 2026-08-28: ver `docs/ESTADO_ACTUAL.md`).

## El audio no son archivos

Todo el sonido se genera en el navegador con Web Audio: **0 KB y ninguna
petición de red**. El viento son tres capas de ruido filtrado (cuerpo
grave, silbido lejano y roce de arena), cada una modulada con un periodo
distinto y no múltiplo de los otros, para que la combinación tarde
muchísimo en repetirse y el oído no detecte el bucle.

Arranca **siempre con sonido**, sin preguntar: el clic de "ENTRAR →" en
la bienvenida hace de gesto de permiso del navegador para audio.

## Peso de página

Las imágenes decorativas (`assets/brand/`) están en `.webp` sin pérdida
y las fuentes (`assets/fonts/`) en `.woff2` — mismo resultado en
pantalla, contenedor mucho más liviano. Dos excepciones a propósito:
`sello-aventura-garantizada.png` y `shineray-shm-logo-blanco.png` siguen
en `.png` porque `backend/src/notificaciones/templates/correos.ts` los
incrusta en los correos por nombre de archivo exacto, y el soporte de
webp en clientes de correo es mucho menos confiable que en navegadores.
Si se agrega una imagen nueva a `assets/brand/` y no la usa ningún
correo, conviene sumarla también como `.webp` sin pérdida (`Pillow`:
`im.save(out, format="WEBP", lossless=True)`) en vez de `.png`.

## Antes de desplegar

Editar `js/config.js`:

- `API_BASE_URL` — URL pública del backend ya desplegado.
- `EVENTO_ID` — opcional. Si se deja vacío toma el primer evento que
  encuentre, que alcanza porque este sitio es de un solo evento.

Y en `sw.js`: **subir el número de versión de `CACHE`** en cada despliegue
que cambie CSS o JS. El service worker sirve primero lo cacheado, así que
sin ese cambio los visitantes que ya entraron seguirían viendo la versión
vieja.

Ver [`../docs/ESTADO_ACTUAL.md`](../docs/ESTADO_ACTUAL.md) para el
panorama completo y [`../docs/PENDIENTES_CLIENTE.md`](../docs/PENDIENTES_CLIENTE.md)
para lo que falta configurar.
