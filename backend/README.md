# Backend — Sistema Web de Inscripción y Gestión de Asistentes

API REST en NestJS + Prisma/PostgreSQL. Cubre las Semanas 1 y 4 del plan
en [`../docs/COMPARATIVA_Y_PLAN.md`](../docs/COMPARATIVA_Y_PLAN.md):
proyecto base + esquema de base de datos + registro/login (Semana 1), y
notificaciones automáticas de correo (Semana 4). El panel admin
(`../admin/`) y el sitio de registro (`../registro/`) son las Semanas 2-3.

## Qué incluye

- **Esquema Prisma** (`prisma/schema.prisma`): `Admin`, `Evento`,
  `Asistente`, `Notificacion`.
- **Auth**: `POST /api/auth/login` con JWT. No hay endpoint de registro de
  admin (se crea por seed, ver abajo) — el alcance cotizado es un panel por
  cliente, no un sistema multi-tenant.
- **Eventos**: `GET /api/eventos` (público, para el sitio de registro),
  `GET /api/eventos/:id`, `POST /api/eventos` y `PATCH /api/eventos/:id`
  (protegidos, panel administrativo).
- **Asistentes**: `POST /api/eventos/:eventoId/asistentes` (público, es el
  formulario de inscripción), `GET /api/eventos/:eventoId/asistentes`,
  `GET .../total`, `GET .../:asistenteId`, `PATCH .../:asistenteId/llegada`
  (check-in) y `DELETE .../:asistenteId` (protegidos, panel — borra en
  cascada las notificaciones del asistente).
- **Notificaciones** (`src/notificaciones/`, ver
  [`../docs/SEMANA_4.md`](../docs/SEMANA_4.md)): cron cada minuto que
  procesa las notificaciones `PENDIENTE` (confirmación, aviso previo,
  aviso final) y las envía por correo vía Resend. Sin `RESEND_API_KEY`
  configurada, solo las loguea (no falla). `POST /api/notificaciones/procesar`
  (protegido) dispara el procesamiento a mano.

## Qué NO incluye todavía

- Hosting/dominio de producción (Semana 4-5) — hoy corre en local.
- Reintentos automáticos de notificaciones fallidas.
- Cuenta real de Resend configurada — ver
  [`../docs/PENDIENTES_CLIENTE.md`](../docs/PENDIENTES_CLIENTE.md).

## Cómo correr en local

```bash
cp .env.example .env        # completar DATABASE_URL y JWT_SECRET
npm install
npm run prisma:migrate      # crea las tablas en PostgreSQL
ADMIN_EMAIL=tu@correo.com ADMIN_PASSWORD=una-clave-segura npx prisma db seed
npm run start:dev
```

La API queda en `http://localhost:3000/api`.

## Decisiones tomadas en esta primera etapa

- **Prisma** en vez de TypeORM: esquema declarativo, migraciones
  versionadas y tipos generados automáticamente — reduce fricción para
  quien retome esto después.
- **Cédula ecuatoriana con validación real** (`src/common/validators/`):
  el cliente es ecuatoriano, así que valida provincia, tercer dígito y
  dígito verificador (módulo 10), no solo "10 dígitos".
- **Unicidad de cédula por evento, no global**: una misma persona puede
  registrarse a distintos congresos: el `@@unique` es
  `(eventoId, cedula)`.
- Pendiente de decidir (ver `../docs/COMPARATIVA_Y_PLAN.md` § Riesgos):
  proveedor de correo transaccional, proveedor de hosting y dominio.
