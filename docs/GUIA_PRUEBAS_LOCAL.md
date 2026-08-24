# Guía paso a paso: probar todo en tu máquina (Semanas 1-4)

> Última actualización: 2026-08-24. Esto es para correr y probar vos
> mismo, en tu compu, todo lo que se construyó hasta ahora — sin tocar
> producción ni gastar en hosting. Sirve como checklist de aceptación:
> si llegás al final y todo pasó, las Semanas 1-4 están funcionando.

## 0. Lo que necesitás instalado

- **Node.js** 20 o superior. Verificar con `node -v`.
- **PostgreSQL** corriendo en tu máquina. Opciones:
  - Instalarlo directo ([postgresql.org/download](https://www.postgresql.org/download/)).
  - O con Docker, si ya lo tenés: `docker run --name pg-rideexperience -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`
- **Git**, para clonar el repo y pararte en la rama correcta.

## 1. Bajar el código

```bash
git clone https://github.com/Jaywrkr/RIDEEXPERIENCE.git
cd RIDEEXPERIENCE
git checkout claude/las-tanusas-landing-8ttqff
```

Esta es la rama que tiene todo lo fusionado hasta ahora (el repo no
tiene una rama `main` — esta hace ese papel).

## 2. Preparar la base de datos

Si instalaste Postgres directo, creá la base:

```bash
createdb rideexperience
```

Si usaste el comando de Docker de arriba, la base ya existe (usuario
`postgres`, contraseña `postgres`); igual hay que crearla:

```bash
docker exec -it pg-rideexperience createdb -U postgres rideexperience
```

## 3. Configurar y levantar el backend

```bash
cd backend
cp .env.example .env
```

Abrí `backend/.env` y editá al menos estas dos líneas (las demás las
podés dejar como están para probar en local):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rideexperience?schema=public"
JWT_SECRET="cualquier-cadena-larga-para-pruebas"
```

(`RESEND_API_KEY` dejala vacía por ahora — sin eso, los correos se
simulan en la consola en vez de enviarse de verdad. Ver el paso 7.)

Ahora instalá dependencias, creá las tablas y generá tu usuario admin:

```bash
npm install
npm run prisma:migrate
ADMIN_EMAIL=tu@correo.com ADMIN_PASSWORD=una-clave-de-prueba npx prisma db seed
npm run start:dev
```

**Debería quedar corriendo** y en la consola ver una lista de rutas
mapeadas (`Mapped {/api/auth/login, POST} route`, etc.) y al final
`Nest application successfully started`. Dejá esta terminal abierta.

**Probalo con el navegador**: abrí `http://localhost:3000/api/eventos`
— tiene que devolver `[]` (una lista vacía, todavía no creaste ningún
evento). Si ves eso, el backend está vivo.

## 4. Levantar el panel administrativo

Abrí **otra terminal** (dejá la del backend corriendo) y desde la raíz
del repo:

```bash
cd admin
python3 -m http.server 8080
```

(Cualquier servidor de archivos estáticos sirve — este es el más a mano
si tenés Python instalado. Si no, `npx serve .` con Node también
funciona.)

Abrí `http://localhost:8080` en el navegador.

**Qué probar ahí:**
1. Iniciar sesión con el correo/clave que usaste en el seed
   (`ADMIN_EMAIL` / `ADMIN_PASSWORD` del paso 3). ✅ si te lleva al
   panel.
2. Click en "+ Nuevo evento", completar nombre / lugar / fecha, crear.
   ✅ si aparece en el selector de arriba y se cargan sus datos abajo.
3. Editar algún campo (por ejemplo la descripción) y "Guardar cambios".
   ✅ si no tira error y al recargar la página el cambio sigue ahí.
4. Mirar la sección "Asistentes" — todavía debería estar vacía (todavía
   no te registraste desde el sitio público).

## 5. Levantar el sitio público de registro

Abrí **una tercera terminal**:

```bash
cd registro
python3 -m http.server 8081
```

Antes de abrirlo en el navegador, si querés apuntar a un evento
específico (en vez de que tome automáticamente el primero que
encuentre), editá `registro/js/config.js` y pegá el `id` del evento que
creaste en el paso 4 en `EVENTO_ID`. Para pruebas rápidas podés dejarlo
vacío — toma el primero.

Abrí `http://localhost:8081` en el navegador.

**Qué probar ahí:**
1. ✅ Si ves el nombre, lugar y fecha del evento que creaste en el panel
   (no un texto de mockup).
2. Completar el formulario:
   - **Cédula**: tiene que ser una cédula ecuatoriana válida de verdad
     (con dígito verificador correcto), no cualquier número de 10
     dígitos — si usás una inventada, la va a rechazar con
     "La cedula ingresada no es valida." Podés generar una válida de
     prueba, o usar la tuya.
   - Nombre, correo (uno tuyo real si querés ver el correo simulado con
     tu nombre), teléfono.
3. Enviar. ✅ si aparece la pantalla de confirmación ("¡Registro
   confirmado!").
4. Intentar registrarte de nuevo con la misma cédula. ✅ si te rechaza
   con "Esta cedula ya esta registrada en este evento."

## 6. Verificar que el registro llegó al panel

Volvé a la pestaña del panel admin (`localhost:8080`) y recargá.

**Qué probar:**
- ✅ El contador "Asistentes registrados" ahora dice 1 (o más, si
  probaste varias veces con cédulas distintas).
- ✅ Tu registro aparece en la tabla, con estado `REGISTRADO`.

## 7. Verificar las notificaciones de correo

Sin `RESEND_API_KEY` configurada, no se manda ningún correo real, pero
podés verificar que el sistema sí las procesa:

**Opción A — esperar el cron automático** (hasta 1 minuto): mirá la
terminal donde corre el backend. A los pocos segundos de haberte
registrado debería aparecer una línea como:

```
[MailerService] [correo simulado] a=tu@correo.com asunto="Registro confirmado — <nombre de tu evento>"
```

**Opción B — forzarlo ahora mismo**, sin esperar, con el token del
login (reemplazá `TU_TOKEN` por el que te devuelve el login — se puede
ver abriendo las herramientas de desarrollador del navegador → pestaña
Network → la petición a `/api/auth/login` → Response):

```bash
curl -X POST http://localhost:3000/api/notificaciones/procesar \
  -H "Authorization: Bearer TU_TOKEN"
```

✅ si devuelve algo como `{"enviadas":1,"fallidas":0}` y aparece la
misma línea de log de arriba.

Si además configuraste `fechaAvisoPrevio` / `fechaAvisoFinal` al crear
el evento (paso 4) con una fecha ya pasada, vas a ver también esos dos
correos simulados — así podés confirmar los 3 tipos sin esperar a la
fecha real del evento.

## 8. Apagar todo y dejar la máquina limpia

En cada terminal, `Ctrl+C` para frenar el backend y los dos servidores
estáticos. Si querés borrar los datos de prueba:

```bash
dropdb rideexperience
```

(o `docker rm -f pg-rideexperience` si usaste el contenedor de Docker).

## Si algo no funciona

- **El backend no arranca / error de conexión a la base**: revisá que
  Postgres esté corriendo (`pg_isready` o que el contenedor de Docker
  esté `Up`) y que `DATABASE_URL` en `backend/.env` tenga el usuario,
  contraseña y puerto correctos.
- **El panel admin no puede loguearse**: confirmá que corriste el
  comando `npx prisma db seed` del paso 3 con el correo/clave que estás
  usando para entrar.
- **El sitio de registro dice "Todavía no hay ningún evento creado"**:
  te faltó crear un evento desde el panel admin primero (paso 4).
- **La cédula siempre se rechaza**: no es un bug — la validación es
  real (algoritmo del Registro Civil ecuatoriano), tiene que ser una
  cédula válida de verdad, no cualquier secuencia de 10 dígitos.

## Documentos relacionados

- [`ESTADO_ACTUAL.md`](./ESTADO_ACTUAL.md)
- [`COMPARATIVA_Y_PLAN.md`](./COMPARATIVA_Y_PLAN.md) — plan completo.
- [`SEMANA_3.md`](./SEMANA_3.md) / [`SEMANA_4.md`](./SEMANA_4.md) —
  detalle técnico de cada parte.
- [`PENDIENTES_CLIENTE.md`](./PENDIENTES_CLIENTE.md) — lo que falta para
  llevar esto de "funciona en mi compu" a producción de verdad (hosting,
  dominio, Resend real, etc.).
