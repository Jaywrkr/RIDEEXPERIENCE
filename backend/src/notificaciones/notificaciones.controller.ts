import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(
    private readonly notificacionesService: NotificacionesService,
    private readonly config: ConfigService,
  ) {}

  // Disparo manual para el panel/pruebas: no hay que esperar al proximo
  // ciclo del cron para confirmar que el envio funciona.
  @UseGuards(JwtAuthGuard)
  @Post('procesar')
  procesar() {
    return this.notificacionesService.procesarPendientes();
  }

  // Punto de entrada para Vercel Cron (ver backend/vercel.json). En
  // serverless no hay proceso de fondo que sostenga el @Cron de
  // NotificacionesScheduler entre invocaciones, asi que en produccion en
  // Vercel el envio depende de que esta ruta se llame periodicamente
  // desde afuera. Protegida por un secreto compartido, no por JWT
  // (Vercel Cron no puede hacer login).
  @Get('cron')
  cron(@Headers('authorization') authorization?: string) {
    const secret = this.config.get<string>('CRON_SECRET');
    if (secret && authorization !== `Bearer ${secret}`) {
      throw new ForbiddenException('Token de cron invalido.');
    }
    return this.notificacionesService.procesarPendientes();
  }
}
