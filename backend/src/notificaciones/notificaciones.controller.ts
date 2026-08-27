import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Webhook } from 'svix';
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

  // Punto de entrada para Vercel Cron (ver backend/vercel.json) y para
  // cualquier scheduler externo (por ejemplo, uno que llame esta ruta
  // cada 10-15 minutos durante el dia de un aviso masivo -- ver
  // MAX_POR_CORRIDA en notificaciones.service.ts). En serverless no hay
  // proceso de fondo que sostenga el @Cron de NotificacionesScheduler
  // entre invocaciones, asi que en produccion en Vercel el envio depende
  // de que esta ruta se llame periodicamente desde afuera. Protegida por
  // un secreto compartido, no por JWT (un cron no puede hacer login).
  @Get('cron')
  cron(@Headers('authorization') authorization?: string) {
    const secret = this.config.get<string>('CRON_SECRET');
    if (secret && authorization !== `Bearer ${secret}`) {
      throw new ForbiddenException('Token de cron invalido.');
    }
    return this.notificacionesService.procesarPendientes();
  }

  // Recibe los eventos de entrega de Resend (entregado, rebotado,
  // abierto...) y los guarda contra la Notificacion que los origino, via
  // proveedorId. Hay que configurar esta URL como webhook en el
  // dashboard de Resend (Webhooks -> Add Endpoint) y copiar el "Signing
  // Secret" que da (empieza con "whsec_") a RESEND_WEBHOOK_SECRET.
  //
  // La firma (Svix, el proveedor de webhooks que usa Resend por debajo)
  // se calcula sobre los bytes crudos del body, no sobre el JSON ya
  // parseado -- por eso se lee req.rawBody (habilitado con
  // `rawBody: true` en main.ts / api/[...proxy].ts) en vez de @Body().
  @Post('webhook-resend')
  webhookResend(@Req() req: RawBodyRequest<Request>, @Headers() headers: Record<string, string>) {
    const secret = this.config.get<string>('RESEND_WEBHOOK_SECRET');
    if (!secret) {
      // No configurado todavia: 503 en vez de aceptar sin verificar,
      // para no procesar payloads que nadie garantiza que vengan de
      // Resend.
      throw new ServiceUnavailableException('Webhook de Resend no configurado.');
    }
    if (!req.rawBody) {
      throw new BadRequestException('Falta el cuerpo de la request.');
    }

    let evento: { type: string; data: { email_id?: string } };
    try {
      const wh = new Webhook(secret);
      evento = wh.verify(req.rawBody, {
        'svix-id': headers['svix-id'],
        'svix-timestamp': headers['svix-timestamp'],
        'svix-signature': headers['svix-signature'],
      }) as typeof evento;
    } catch {
      throw new ForbiddenException('Firma de webhook invalida.');
    }

    return this.notificacionesService.procesarEventoResend(evento);
  }
}
