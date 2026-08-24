import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificacionesService } from './notificaciones.service';

@Injectable()
export class NotificacionesScheduler {
  private readonly logger = new Logger(NotificacionesScheduler.name);

  constructor(private readonly notificaciones: NotificacionesService) {}

  // Cada minuto: suficiente para que la confirmacion se sienta
  // "inmediata" sin necesidad de un mecanismo aparte solo para ese caso.
  // Los avisos previo/final dependen de fechas configuradas con horas de
  // anticipacion, un minuto de margen no afecta en la practica.
  @Cron(CronExpression.EVERY_MINUTE)
  async procesarNotificacionesPendientes() {
    try {
      await this.notificaciones.procesarPendientes();
    } catch (error) {
      this.logger.error(`Error inesperado procesando notificaciones: ${(error as Error).message}`);
    }
  }
}
