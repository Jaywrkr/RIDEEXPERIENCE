# Pendientes para vos

> Última actualización: 2026-08-26. Cosas que no puede resolver una sesión
> de IA: cuentas, archivos, decisiones y ajustes que solo existen en el
> panel de Vercel. Ordenadas por lo que más mueve la aguja.

## 1. La fuente de texto — es lo que más impacto tiene

Hoy la única tipografía disponible para texto es **DIN Pro Black**, que es
un peso **900**, de titular. Por eso todo el texto corrido, tanto del
sitio como del panel, se lee como un muro de negritas: cuando todo pesa
igual, nada destaca.

Se compensó con más interlineado y limitando el ancho de lectura, pero es
un parche. **Con DIN Pro Regular o Medium el proyecto entero mejora de
golpe**, sin tocar nada más del diseño.

⚠️ **Los dos archivos `.otf` que subiste hasta ahora ya estaban en el
repo** — al compararlos byte a byte con lo que ya había, resultaron ser
exactamente el mismo Discota-CondensedRough y el mismo DINPro-Black, no un
peso nuevo. Es posible que el archivo de Regular/Medium no se haya llegado
a adjuntar. Si volvés a subirlo, fijate que el nombre del archivo diga
claramente el peso (por ejemplo `DINPro-Regular.otf` o
`DINPro-Medium.otf`) para no confundirlo con el que ya está. Apenas
llegue, son unos minutos de trabajo aplicarlo en los dos sitios.

## 2. Los despliegues automáticos ya están apagados ✅

Esto quedó resuelto **desde el repo**, no desde el panel: cada proyecto
tiene un `vercel.json` con `{ "git": { "deploymentEnabled": false } }`, así
que **ningún push dispara un build**, en ninguna rama.

Se hizo así en vez de con el "Ignored Build Step" del dashboard para que
quede versionado y no dependa de que alguien lo recuerde configurar.

**Para desplegar cuando vos quieras**, dos opciones:

- **Redeploy**: Vercel → proyecto → Deployments → elegí el commit → "..."
  → Redeploy.
- **Deploy Hook**: Settings → Git → Deploy Hooks. Te da una URL que
  dispara el deploy con un `curl -X POST <url>`.

> Ojo con el orden: el commit que apaga los deploys todavía se despliega
> (Vercel lee el archivo del commit entrante). A partir del siguiente, ya
> no.

## 3. ⚠️ Antes del próximo deploy del backend: la cédula se borra

La migración que quita la cédula **elimina esa columna y todos sus datos,
de forma irreversible**, y corre sola en el próximo despliegue del
backend.

**Si hay inscripciones previas y esos números te sirven para algo,
exportalos antes.** Si no, no hay nada que hacer.

Contexto de la decisión: al quitar la cédula, el **correo** pasó a ser lo
único que impide que la misma persona se inscriba dos veces. Esa
protección quedó puesta.

## 4. Correos: siguen sin enviarse

El mecanismo funciona, pero falta la cuenta:

- [ ] Crear cuenta en [Resend](https://resend.com) y verificar tu dominio
      de envío (o usar el de pruebas mientras tanto).
- [ ] Cargar `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en **Vercel →
      `rideexperience-api` → Settings → Environment Variables**, y
      redesplegar.

Sin esto la gente se registra normal, pero **no recibe ningún correo**.

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
- [ ] **Borrar 2 ramas de GitHub** ya fusionadas:
      `claude/seo-metadata-jay-jaramillo-4w1p6b` y
      `claude/passport-stamp-notifications-s0vk0a`.
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
