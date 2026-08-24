-- Pasaporte de sellos: una fila por código físico entregado.
-- Ejecutar una sola vez contra la base de datos de Vercel Postgres.

create table if not exists personas (
  id serial primary key,
  codigo text unique not null,
  email text,
  sello_1_fecha timestamptz,
  sello_2_fecha timestamptz,
  sello_3_fecha timestamptz,
  sello_2_notificado_en timestamptz,
  sello_3_notificado_en timestamptz,
  creado_en timestamptz not null default now()
);

create index if not exists personas_codigo_idx on personas (codigo);
