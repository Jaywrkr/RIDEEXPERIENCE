import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstadoNotificacion, TipoNotificacion } from '@prisma/client';
import { conCodigo } from '../asistentes/codigo.util';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './mailer.service';
import { PlantillasCorreo } from './templates/correos';

const PLANTILLA_POR_TIPO: Record<
  TipoNotificacion,
  (typeof PlantillasCorreo)['confirmacion']
> = {
  [TipoNotificacion.CONFIRMACION]: PlantillasCorreo.confirmacion,
  [TipoNotificacion.AVISO_PREVIO]: PlantillasCorreo.avisoPrevio,
  [TipoNotificacion.AVISO_FINAL]: PlantillasCorreo.avisoFinal,
};

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Resend limita por defecto a 2 envios por segundo en cualquier plan.
// Este pequeño respiro entre correo y correo evita pisar ese limite
// cuando un aviso masivo (previo/final) deja a todos los asistentes con
// la misma fecha programada y por lo tanto todos "vencidos" a la vez.
const PAUSA_ENTRE_ENVIOS_MS = 550;

// Tope de cuantas notificaciones procesa una sola corrida. Sin esto, el
// dia que vence el aviso masivo, una sola invocacion (cron o el envio
// disparado por un registro nuevo) intentaria mandar los ~150 correos
// de punta a punta: al ritmo de arriba son minutos, mas cerca del limite
// de tiempo de ejecucion de la funcion serverless que de un request
// normal. Se procesan las mas antiguas primero (orderBy programadaPara)
// y el resto queda PENDIENTE para la proxima corrida -- por eso conviene
// disparar este mismo endpoint cada 10-15 minutos con un cron externo
// mientras dura el envio masivo del dia (ver notas de despliegue).
const MAX_POR_CORRIDA = 25;

// Cuantos contactos sincroniza con la Audience de Resend una sola corrida
// del cron antes de mandar el broadcast de un aviso masivo. Mismo tope y
// misma pausa que arriba, mismo motivo (2 req/s de Resend): sincronizar
// contacto es tambien una llamada API por asistente.
const LOTE_SINCRONIZACION_AUDIENCIA = 25;

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Busca notificaciones CONFIRMACION en PENDIENTE cuya fecha ya llego y
   * las envia una por una (hasta MAX_POR_CORRIDA por llamada, ver arriba).
   * AVISO_PREVIO y AVISO_FINAL ya no pasan por aca -- van como Broadcast,
   * ver procesarAvisoMasivo() -- porque a diferencia de la confirmacion
   * (inmediata, una persona a la vez) le llegan a los ~150 de golpe el
   * mismo dia, y ahi el ritmo de entrega conviene dejarselo a Resend en
   * vez de mandarlo correo por correo desde una funcion serverless.
   */
  async procesarPendientes(): Promise<{ enviadas: number; fallidas: number }> {
    const pendientes = await this.prisma.notificacion.findMany({
      where: {
        tipo: TipoNotificacion.CONFIRMACION,
        estado: EstadoNotificacion.PENDIENTE,
        programadaPara: { lte: new Date() },
      },
      orderBy: { programadaPara: 'asc' },
      take: MAX_POR_CORRIDA,
      include: { asistente: true, evento: true },
    });

    let enviadas = 0;
    let fallidas = 0;
    const sitioUrl = this.config.get<string>('REGISTRO_SITIO_URL');

    for (const [indice, notificacion] of pendientes.entries()) {
      if (indice > 0) await esperar(PAUSA_ENTRE_ENVIOS_MS);

      const plantilla = PLANTILLA_POR_TIPO[notificacion.tipo];
      const { subject, html } = plantilla({
        nombreAsistente: notificacion.asistente.nombre,
        evento: notificacion.evento,
        sitioUrl,
        codigo: conCodigo(notificacion.asistente).codigo,
      });

      try {
        const proveedorId = await this.mailer.enviar(notificacion.asistente.correo, subject, html);
        await this.prisma.notificacion.update({
          where: { id: notificacion.id },
          data: { estado: EstadoNotificacion.ENVIADA, enviadaEn: new Date(), proveedorId },
        });
        enviadas += 1;
      } catch (error) {
        this.logger.error(
          `Fallo el envio de notificacion ${notificacion.id} (${notificacion.tipo}) a ${notificacion.asistente.correo}: ${(error as Error).message}`,
        );
        await this.prisma.notificacion.update({
          where: { id: notificacion.id },
          data: { estado: EstadoNotificacion.FALLIDA },
        });
        fallidas += 1;
      }
    }

    if (enviadas || fallidas) {
      this.logger.log(`Procesamiento de notificaciones: ${enviadas} enviadas, ${fallidas} fallidas.`);
    }

    return { enviadas, fallidas };
  }

  /**
   * Envia AVISO_PREVIO o AVISO_FINAL como un solo Resend Broadcast a todos
   * los que ya tienen esa notificacion PENDIENTE y vencida. Dos fases,
   * repartidas en corridas del cron para no pisar el limite de 2 req/s:
   *
   *  1. Sincronizar a cada asistente pendiente como contacto de la
   *     Audience (hasta LOTE_SINCRONIZACION_AUDIENCIA por corrida).
   *  2. Cuando ya no queda nadie por sincronizar, un solo broadcast le
   *     llega a todos de una vez -- de ahi en mas la entrega ritmica es
   *     cosa de Resend, no de este loop.
   *
   * Sin personalizacion por asistente a proposito (mismo evento, misma
   * fecha para todos): mas simple, mas rapido y mejor deliverability que
   * mandar ~150 correos individuales el mismo dia.
   */
  async procesarAvisoMasivo(
    tipo: typeof TipoNotificacion.AVISO_PREVIO | typeof TipoNotificacion.AVISO_FINAL,
  ): Promise<{ estado: 'nada-pendiente' | 'sincronizando' | 'enviado'; cantidad?: number }> {
    const pendientes = await this.prisma.notificacion.findMany({
      where: {
        tipo,
        estado: EstadoNotificacion.PENDIENTE,
        programadaPara: { lte: new Date() },
      },
      include: { asistente: true, evento: true },
    });

    if (pendientes.length === 0) {
      return { estado: 'nada-pendiente' };
    }

    const sinSincronizar = pendientes.filter((n) => !n.sincronizadaEnAudiencia);
    if (sinSincronizar.length > 0) {
      const lote = sinSincronizar.slice(0, LOTE_SINCRONIZACION_AUDIENCIA);
      for (const [indice, notificacion] of lote.entries()) {
        if (indice > 0) await esperar(PAUSA_ENTRE_ENVIOS_MS);
        await this.mailer.sincronizarContacto(notificacion.asistente.correo, notificacion.asistente.nombre);
        await this.prisma.notificacion.update({
          where: { id: notificacion.id },
          data: { sincronizadaEnAudiencia: true },
        });
      }
      this.logger.log(
        `Sincronizando audiencia para ${tipo}: ${lote.length} de ${sinSincronizar.length} pendientes.`,
      );
      return { estado: 'sincronizando', cantidad: sinSincronizar.length - lote.length };
    }

    const plantilla = PLANTILLA_POR_TIPO[tipo];
    const sitioUrl = this.config.get<string>('REGISTRO_SITIO_URL');
    // Merge tag de Resend: cada quien ve su propio nombre sin que nosotros
    // lo personalicemos correo por correo -- lo unico que Broadcast ofrece
    // gratis sin volver a mandar uno por uno.
    const { subject, html } = plantilla({
      nombreAsistente: '{{{FIRST_NAME|ahí}}}',
      evento: pendientes[0].evento,
      sitioUrl,
    });

    const broadcastId = await this.mailer.enviarBroadcast(subject, html);
    await this.prisma.notificacion.updateMany({
      where: { id: { in: pendientes.map((n) => n.id) } },
      data: { estado: EstadoNotificacion.ENVIADA, enviadaEn: new Date(), proveedorId: broadcastId },
    });

    this.logger.log(`Aviso masivo ${tipo} enviado como broadcast a ${pendientes.length} asistentes.`);
    return { estado: 'enviado', cantidad: pendientes.length };
  }

  /**
   * Guarda un evento de entrega de Resend (delivered, bounced, opened...)
   * contra la Notificacion que lo origino. La firma ya se verifico en el
   * controller antes de llegar aca.
   */
  async procesarEventoResend(evento: { type: string; data: { email_id?: string } }) {
    const emailId = evento.data?.email_id;
    if (!emailId) return { ok: true };

    const notificaciones = await this.prisma.notificacion.findMany({
      where: { proveedorId: emailId },
    });
    if (notificaciones.length === 0) {
      // Puede ser un correo mandado desde otra app que comparte la misma
      // cuenta de Resend (webhooks se configuran a nivel de cuenta, no
      // por dominio/proyecto): no es un error, simplemente no es nuestro.
      this.logger.warn(`Webhook de Resend sin notificacion asociada: email_id=${emailId} tipo=${evento.type}`);
      return { ok: true };
    }
    if (notificaciones.length > 1) {
      // AVISO_PREVIO/AVISO_FINAL van como Broadcast: todos sus
      // destinatarios comparten el mismo proveedorId (el id del
      // broadcast), y el evento del webhook no trae ninguna referencia
      // nuestra que diga a cual de ellos corresponde. Marcar el estado de
      // uno solo arriesgaria pisar el de otro, asi que se ignora a
      // proposito -- es el costo de no tener tracking por destinatario que
      // se acepto al pasar los avisos masivos a Broadcast.
      this.logger.debug(
        `Evento de webhook de un broadcast (${notificaciones.length} destinatarios, tipo=${evento.type}): sin tracking individual.`,
      );
      return { ok: true };
    }
    const notificacion = notificaciones[0];

    // "email.delivered" -> "delivered", etc. Sin mapear a un enum cerrado
    // porque Resend puede agregar tipos de evento nuevos con el tiempo.
    const tipoEvento = evento.type.replace(/^email\./, '');

    if (tipoEvento === 'opened') {
      // Puede llegar mas de un evento "opened" (reabrir el correo,
      // trackers de algunos clientes que precargan la imagen): se guarda
      // solo la primera apertura.
      if (!notificacion.abiertaEn) {
        await this.prisma.notificacion.update({
          where: { id: notificacion.id },
          data: { abiertaEn: new Date() },
        });
      }
    } else {
      await this.prisma.notificacion.update({
        where: { id: notificacion.id },
        data: { entregaEstado: tipoEvento, entregaActualizadaEn: new Date() },
      });
    }

    return { ok: true };
  }
}
