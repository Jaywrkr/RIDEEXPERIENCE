import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  // Disparo manual para el panel/pruebas: no hay que esperar al proximo
  // ciclo del cron para confirmar que el envio funciona.
  @UseGuards(JwtAuthGuard)
  @Post('procesar')
  procesar() {
    return this.notificacionesService.procesarPendientes();
  }
}
