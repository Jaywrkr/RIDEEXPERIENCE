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

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Busca notificaciones PENDIENTE cuya fecha ya llego y las envia. Se
   * llama desde el cron (scheduler.service.ts) y tambien se puede
   * disparar a mano (endpoint de admin) para no depender de esperar al
   * proximo ciclo, por ejemplo en pruebas.
   */
  async procesarPendientes(): Promise<{ enviadas: number; fallidas: number }> {
    const pendientes = await this.prisma.notificacion.findMany({
      where: {
        estado: EstadoNotificacion.PENDIENTE,
        programadaPara: { lte: new Date() },
      },
      include: { asistente: true, evento: true },
    });

    let enviadas = 0;
    let fallidas = 0;
    const sitioUrl = this.config.get<string>('REGISTRO_SITIO_URL');

    for (const notificacion of pendientes) {
      const plantilla = PLANTILLA_POR_TIPO[notificacion.tipo];
      const { subject, html } = plantilla({
        nombreAsistente: notificacion.asistente.nombre,
        evento: notificacion.evento,
        sitioUrl,
        codigo: conCodigo(notificacion.asistente).codigo,
      });

      try {
        await this.mailer.enviar(notificacion.asistente.correo, subject, html);
        await this.prisma.notificacion.update({
          where: { id: notificacion.id },
          data: { estado: EstadoNotificacion.ENVIADA, enviadaEn: new Date() },
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
}
