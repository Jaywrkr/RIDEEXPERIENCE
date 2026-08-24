import { sql } from '../lib/db.js';
import { yaLlegoFecha } from '../lib/fechas.js';
import { enviarNotificacionSello } from '../lib/mailer.js';

// Job diario (Vercel Cron, ver vercel.json). Por cada sello cuya fecha ya
// llegó, notifica por correo a quienes todavía no fueron avisados. No
// otorga el sello: solo avisa que ya está disponible para ir a buscarlo.
async function notificarSello(n) {
  if (!yaLlegoFecha(n)) return 0;

  const columnaPrevia = n === 2 ? 'sello_1_fecha' : 'sello_2_fecha';
  const columnaNotificado = n === 2 ? 'sello_2_notificado_en' : 'sello_3_notificado_en';

  const { rows } = await sql.query(
    `select codigo, email from personas
     where ${columnaPrevia} is not null
       and ${columnaNotificado} is null
       and email is not null`
  );

  for (const persona of rows) {
    await enviarNotificacionSello(n, { email: persona.email, codigo: persona.codigo });
    await sql.query(`update personas set ${columnaNotificado} = now() where codigo = $1`, [persona.codigo]);
  }

  return rows.length;
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const notificadosSello2 = await notificarSello(2);
  const notificadosSello3 = await notificarSello(3);

  res.status(200).json({ notificadosSello2, notificadosSello3 });
}
