import { sql, normalizarCodigo } from '../lib/db.js';
import { obtenerEstado, serializarEstado } from '../lib/estado.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Se llama al terminar la animación de sellado, en el primer ingreso de cada
// persona: registra su email y otorga el sello 1. En ingresos posteriores es
// idempotente (no vuelve a sellar ni pisa el email ya guardado).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const { codigo: codigoRaw, email } = req.body || {};
  const codigo = normalizarCodigo(codigoRaw);
  if (!codigo) {
    res.status(400).json({ error: 'codigo_requerido' });
    return;
  }

  const existente = await obtenerEstado(codigo);
  if (!existente) {
    res.status(404).json({ error: 'codigo_invalido' });
    return;
  }

  if (existente.sello_1_fecha) {
    res.status(200).json({ ...serializarEstado(existente), yaRegistrado: true });
    return;
  }

  if (!email || !EMAIL_RE.test(String(email).trim())) {
    res.status(400).json({ error: 'email_invalido' });
    return;
  }

  const { rows } = await sql`
    update personas
    set email = ${String(email).trim()}, sello_1_fecha = now()
    where codigo = ${codigo} and sello_1_fecha is null
    returning *
  `;

  const persona = rows[0] || (await obtenerEstado(codigo));
  res.status(200).json(serializarEstado(persona));
}
