import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.from = this.config.get<string>('RESEND_FROM_EMAIL', 'Eventos <no-reply@tudominio.com>');

    // Sin API key configurada el backend sigue funcionando (registro,
    // panel, etc.) pero no manda correos — se loguea en vez de fallar,
    // para no bloquear el resto del sistema en desarrollo.
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY no configurada: los correos no se enviaran realmente.');
    }
  }

  // Devuelve el id que asigna Resend al aceptar el envio -- es la unica
  // forma de correlacionar, mas tarde, un evento del webhook ("este
  // correo se entrego"/"rebotó") con la Notificacion nuestra que lo
  // origino. null cuando no hay API key (modo simulado, sin Resend real).
  async enviar(destinatario: string, asunto: string, html: string): Promise<string | null> {
    if (!this.resend) {
      this.logger.log(`[correo simulado] a=${destinatario} asunto="${asunto}"`);
      return null;
    }

    const resultado = await this.resend.emails.send({
      from: this.from,
      to: destinatario,
      subject: asunto,
      html,
    });

    if (resultado.error) {
      throw new Error(resultado.error.message);
    }

    return resultado.data?.id ?? null;
  }
}
