import { normalizarCodigo } from '../lib/db.js';
import { obtenerEstado, serializarEstado } from '../lib/estado.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const codigo = normalizarCodigo(req.query.codigo);
  if (!codigo) {
    res.status(400).json({ error: 'codigo_requerido' });
    return;
  }

  const persona = await obtenerEstado(codigo);
  if (!persona) {
    res.status(404).json({ error: 'codigo_invalido' });
    return;
  }

  res.status(200).json(serializarEstado(persona));
}
