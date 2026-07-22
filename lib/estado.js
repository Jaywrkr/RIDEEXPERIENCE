import { sql } from './db.js';
import { fechaDesbloqueoSello, yaLlegoFecha } from './fechas.js';

// Busca a la persona por código y aplica el autodesbloqueo de sello 2/3 si ya
// llegó su fecha. Devuelve null si el código no existe.
export async function obtenerEstado(codigoNormalizado) {
  const { rows } = await sql`select * from personas where codigo = ${codigoNormalizado}`;
  if (rows.length === 0) return null;
  let persona = rows[0];

  if (persona.sello_1_fecha) {
    if (!persona.sello_2_fecha && yaLlegoFecha(2)) {
      const { rows: actualizado } = await sql`
        update personas set sello_2_fecha = now()
        where codigo = ${codigoNormalizado} and sello_2_fecha is null
        returning *
      `;
      if (actualizado[0]) persona = actualizado[0];
    }
    if (persona.sello_2_fecha && !persona.sello_3_fecha && yaLlegoFecha(3)) {
      const { rows: actualizado } = await sql`
        update personas set sello_3_fecha = now()
        where codigo = ${codigoNormalizado} and sello_3_fecha is null
        returning *
      `;
      if (actualizado[0]) persona = actualizado[0];
    }
  }

  return persona;
}

export function serializarEstado(persona) {
  return {
    codigo: persona.codigo,
    tieneEmail: Boolean(persona.email),
    sellos: {
      1: { desbloqueado: Boolean(persona.sello_1_fecha), fecha: persona.sello_1_fecha },
      2: {
        desbloqueado: Boolean(persona.sello_2_fecha),
        fecha: persona.sello_2_fecha,
        disponibleDesde: fechaDesbloqueoSello(2),
      },
      3: {
        desbloqueado: Boolean(persona.sello_3_fecha),
        fecha: persona.sello_3_fecha,
        disponibleDesde: fechaDesbloqueoSello(3),
      },
    },
  };
}
