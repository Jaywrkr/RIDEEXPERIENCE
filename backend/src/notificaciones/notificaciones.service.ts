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

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Busca notificaciones PENDIENTE cuya fecha ya llego y las envia (hasta
   * MAX_POR_CORRIDA por llamada, ver arriba). Se llama desde el cron
   * (scheduler.service.ts / notificaciones.controller.ts) y tambien se
   * puede disparar a mano (endpoint de admin) para no depender de esperar
   * al proximo ciclo, por ejemplo en pruebas.
   */
  async procesarPendientes(): Promise<{ enviadas: number; fallidas: number }> {
    const pendientes = await this.prisma.notificacion.findMany({
      where: {
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
   * Guarda un evento de entrega de Resend (delivered, bounced, opened...)
   * contra la Notificacion que lo origino. La firma ya se verifico en el
   * controller antes de llegar aca.
   */
  async procesarEventoResend(evento: { type: string; data: { email_id?: string } }) {
    const emailId = evento.data?.email_id;
    if (!emailId) return { ok: true };

    const notificacion = await this.prisma.notificacion.findFirst({
      where: { proveedorId: emailId },
    });
    if (!notificacion) {
      // Puede ser un correo mandado desde otra app que comparte la misma
      // cuenta de Resend (webhooks se configuran a nivel de cuenta, no
      // por dominio/proyecto): no es un error, simplemente no es nuestro.
      this.logger.warn(`Webhook de Resend sin notificacion asociada: email_id=${emailId} tipo=${evento.type}`);
      return { ok: true };
    }

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
