# Qué se ofreció en la cotización (Sistema Web de Inscripción y Gestión de Asistentes)

> Última actualización: 2026-07-23. Resume el contenido de
> `Cotizacion_Plataforma_Web.pdf` (preparada a nombre de Juan Carlos
> Jaramillo) para que quede como fuente de verdad dentro del repo, sin
> depender del PDF suelto ni del historial de chat.

## Contexto

Es una cotización competitiva, escrita para diferenciarse deliberadamente
en estructura, orden y redacción de dos propuestas de la competencia
(Oscar Tenesaca) que cotizan lo mismo: una para app móvil nativa
(Flutter), otra para plataforma web. **La nuestra responde a la de
plataforma web**, con precio similar (USD 1,100 + IVA) pero incluyendo
hosting y dominio, que la competencia excluye.

## Alcance prometido

### Backend
- API REST
- Base de datos
- Registro de asistentes
- Gestión del evento
- Validaciones de seguridad
- Programación automática de notificaciones de correo

### Panel administrativo
- Login de administrador
- Gestión del evento
- Listado de asistentes registrados
- Consulta de información de cada participante
- Total de asistentes registrados

### Sitio de registro
- Información del congreso (agenda, lugar, fecha)
- Formulario de inscripción
- Registro mediante cédula, nombre completo, correo electrónico y número
  telefónico
- Confirmación de registro
- Diseño responsive, instalable desde el navegador como acceso directo
  (PWA)

### Notificaciones de correo (3, automáticas)
1. Confirmación de registro — al momento de inscribirse.
2. Aviso previo — en la fecha que la organización configure.
3. Aviso final — días antes del evento.

## Stack comprometido

| Capa | Tecnología |
|---|---|
| Frontend | Web responsive (PWA instalable) |
| Servidor | Node.js / NestJS |
| Base de datos | PostgreSQL |
| Comunicación | API REST |
| Notificaciones | Correo transaccional programado |
| Hosting | Incluido en el precio (a diferencia de la competencia) |

## Condiciones comerciales

- **Plazo**: 4 a 5 semanas.
- **Inversión**: USD 1,100.00 + IVA. Incluye hosting y dominio.
- **Forma de pago**: 50% al iniciar, 50% previo a la entrega final.
- **Garantía**: 30 días para corrección de errores del desarrollo
  contratado.

### No incluido (explícito en la cotización)
- Aplicación móvil nativa.
- Mantenimiento posterior a la entrega.
- Integración con WhatsApp (se puede cotizar aparte).
- Nuevos requerimientos fuera del alcance.
- Entrega del código fuente (salvo acuerdo aparte).

## Documentos relacionados

- [`ESTADO_ACTUAL.md`](./ESTADO_ACTUAL.md) — qué existe hoy en este repo.
- [`COMPARATIVA_Y_PLAN.md`](./COMPARATIVA_Y_PLAN.md) — brecha y plan para
  construir lo prometido arriba.
