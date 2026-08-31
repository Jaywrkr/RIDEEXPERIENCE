# Pendientes para vos

> Última actualización: 2026-08-31. Cosas que no puede resolver una sesión
> de IA: cuentas, archivos, decisiones y ajustes que solo existen en el
> panel de Vercel. Ordenadas por lo que más mueve la aguja.
>
> **2026-08-31: los tres proyectos se pusieron al día en producción**
> (commit `d1556c6`, "Merge pull request #30"), disparados con Deploy
> Hooks. Con eso se cerró el punto de la cédula — ver más abajo.
>
> **2026-08-31: los correos ya se envían de verdad.** Se compró
> `atodoterrenoec.com` (en Vercel, $11.25/año), se conectó como dominio
> adicional del proyecto `atodoterreno` (`atodoterreno.vercel.app` sigue
> funcionando igual — el QR que ya se mandó a la gente no se toca), se
> verificó en Resend (DKIM, SPF, DMARC) y se cargaron
> `RESEND_API_KEY`, `RESEND_FROM_EMAIL` y `REGISTRO_SITIO_URL` en
> `rideexperience-api`. Probado de punta a punta: el correo de
> confirmación llega, con logo y sello. El punto 4 de abajo queda
> resuelto.

## ~~1. La fuente de texto~~ — descartado, no es un pendiente real

**2026-08-26: confirmaste que el diseño está definido con exactamente dos
fuentes** (`Discota-CondensedRough` para titulares y `DINPro-Black` para
todo lo demás) **y que nunca pediste un peso Regular/Medium.** Ese
"pendiente" lo había inventado una sesión anterior por su cuenta, no vos
— queda descartado. No hace falta que reenvíes nada ni que aclares nada
más sobre esto.

(Los dos `.otf` sueltos que habías reenviado siguen siendo duplicados
idénticos de los que ya usa el sitio — ver el punto de archivos sueltos
más abajo, en "Cierre", por si querés que los borre.)

## 2. Los despliegues automáticos ya están apagados ✅

Esto quedó resuelto **desde el repo**, no desde el panel: cada proyecto
tiene un `vercel.json` con `{ "git": { "deploymentEnabled": false } }`, así
que **ningún push dispara un build**, en ninguna rama.

Se hizo así en vez de con el "Ignored Build Step" del dashboard para que
quede versionado y no dependa de que alguien lo recuerde configurar.

**Para desplegar cuando vos quieras**: usá el **Deploy Hook**. Cada uno
de los tres proyectos ya tiene uno creado, llamado `manual`, apuntando a
la rama `claude/las-tanusas-landing-8ttqff` (Settings → Git → Deploy
Hooks). Pegás la URL en el navegador, o `curl -X POST <url>`, y listo.

Guardate las tres URLs: son distintas, una por proyecto, y no vencen.

> **El botón "Redeploy" NO sirve para publicar código nuevo.** Reconstruye
> *ese mismo commit viejo*. Como los deploys automáticos están apagados,
> nunca se crea un deployment para el commit nuevo, así que no hay nada
> que redeployar. El Deploy Hook sí construye la punta de la rama.

> Ojo con el orden: el commit que apaga los deploys todavía se despliega
> (Vercel lee el archivo del commit entrante). A partir del siguiente, ya
> no.

## ~~3. La cédula se borra en el próximo deploy~~ — ya pasó ✅

**Resuelto.** La migración destructiva ya corrió: el backend se desplegó
varias veces desde que se agregó (la última, el 2026-08-31 con `d1556c6`)
y `vercel-build` ejecuta `prisma migrate deploy` en cada build. La columna
`cedula` y sus datos ya no existen. No hay nada que exportar ni que
decidir.

Contexto de la decisión: al quitar la cédula, el **correo** pasó a ser lo
único que impide que la misma persona se inscriba dos veces. Esa
protección quedó puesta.

## ~~4. Correos: siguen sin enviarse~~ — resuelto ✅

**2026-08-31: los correos ya llegan.** Dominio `atodoterrenoec.com`
comprado y verificado en Resend, variables cargadas en
`rideexperience-api`, probado con un registro real: el correo de
confirmación llega con logo y sello.

Sigue pendiente cargar las **fechas de los otros dos avisos** (previo y
final) — ver el punto de "Confirmar la fecha del evento" más abajo, y la
nota sobre `fechaAvisoPrevio` / `fechaAvisoFinal` en el panel del evento.
Sin esas fechas, solo sale el correo de confirmación; los otros dos no
tienen cuándo dispararse.

## 5. Confirmar la fecha del evento

Está escrita a mano como **25–27 de septiembre de 2026** en la cuenta
atrás, en la hoja de visado del pasaporte y en varios textos. Si cambia,
decímelo y la actualizo en todos lados.

## 6. Probar con los sentidos, no con mediciones

Dos cosas que se construyeron pero **nadie experimentó todavía**:

- **El sonido.** Todo el audio está sintetizado y lo calibré **midiendo la
  señal**, no escuchándolo. Los niveles son correctos en decibeles, pero
  hace falta que alguien lo oiga con auriculares y diga si el viento está
  bien de volumen y si los sonidos de clic molestan o suman.
- **El teléfono.** Hay cosas que **solo existen en móvil**: la vibración
  al sellar el pasaporte y la respiración de las montañas. Vale la pena
  hacer el flujo completo desde un celular real, escaneando el QR.

## Cierre

- [ ] **Dominio propio** en vez de `*.vercel.app` (opcional, cosmético).
- [x] ~~Borrar 2 ramas de GitHub ya fusionadas~~ — ya no existen
      (verificado 2026-08-27), no hace falta nada de tu parte.
- [ ] **Decidir sobre el pasaporte viejo** (el de código de acceso, en la
      raíz del repo). Su proyecto de Vercel ya está pausado y no molesta.
      Borrar el código sí requiere tu confirmación: esa base puede tener
      inscripciones reales de gente que usó un código.
- [ ] **Confirmar si se pueden borrar los archivos de fuente sueltos**
      `assets/fonts/x` (vacío) y `assets/fonts/Discota-CondensedRough
      (1).otf` / `assets/fonts/dinpro_black (1).otf` (duplicados de los
      que ya usa el sitio) — quedaron de los dos reenvíos que resultaron
      ser el mismo archivo.

## Ya resuelto (no requiere acción)

- ✅ Sitio público y panel administrativo con la identidad real de la
  marca: wordmark oficial, paleta, tipografías, sello y texturas.
- ✅ Cédula retirada de todo el sistema.
- ✅ Suite de 43 pruebas automáticas que verifica el registro de punta a
  punta, incluida la persistencia real de los datos.
- ✅ Dos proyectos de Vercel sin uso pausados (`rideexperience` y
  `rideexperience-registro`), sin borrar nada.
- ✅ Sonido ambiente y de interacción, sintetizado: **0 KB de archivos**.
- ✅ Accesibilidad: contraste AA, objetivos táctiles de 44px, textos
  alternativos y etiquetas en todos los campos.
- ✅ **Logo de Shineray en rojo eliminado de todo el sitio y el panel** —
  se reemplazó por la variante negra o blanca según el fondo, en todos
  los lugares donde aparecía.
- ✅ **Pantalla de bienvenida rehecha**: se quitaron las animaciones de
  "nubes" en bucle infinito (causaban la lentitud reportada) y ahora usa
  el mismo fondo de arena y dunas de la tapa del pasaporte.
