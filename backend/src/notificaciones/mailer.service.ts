import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly audienceId: string | undefined;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.from = this.config.get<string>('RESEND_FROM_EMAIL', 'Eventos <no-reply@tudominio.com>');
    this.audienceId = this.config.get<string>('RESEND_AUDIENCE_ID');

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

  // Da de alta (o actualiza) a un asistente como contacto de la Audience
  // de Resend usada para los avisos masivos (previo/final) -- un
  // broadcast solo le llega a quien ya esta ahi. Sin RESEND_AUDIENCE_ID
  // configurada, no hace nada (modo simulado, igual que enviar()).
  async sincronizarContacto(destinatario: string, nombre: string): Promise<void> {
    if (!this.resend || !this.audienceId) {
      this.logger.log(`[audiencia simulada] contacto=${destinatario}`);
      return;
    }

    const [firstName, ...resto] = nombre.trim().split(/\s+/);
    const resultado = await this.resend.contacts.create({
      audienceId: this.audienceId,
      email: destinatario,
      firstName,
      lastName: resto.join(' ') || undefined,
      unsubscribed: false,
    });

    // Resend responde error si el contacto ya existe en la Audience (por
    // ejemplo, si el aviso previo y el final reusan la misma Audience):
    // no es una falla real, ya esta sincronizado de antes.
    if (resultado.error && !/already exists|ya existe/i.test(resultado.error.message)) {
      throw new Error(resultado.error.message);
    }
  }

  // Crea y despacha un Resend Broadcast a toda la Audience configurada.
  // A diferencia de enviar(), esto no esta sujeto al limite de 2 req/s:
  // es una sola llamada API y Resend reparte la entrega real por su
  // cuenta. Devuelve el id del broadcast (para guardarlo como
  // proveedorId), o null en modo simulado.
  async enviarBroadcast(asunto: string, html: string): Promise<string | null> {
    if (!this.resend || !this.audienceId) {
      this.logger.log(`[broadcast simulado] asunto="${asunto}"`);
      return null;
    }

    const creado = await this.resend.broadcasts.create({
      audienceId: this.audienceId,
      from: this.from,
      subject: asunto,
      html,
    });
    if (creado.error) {
      throw new Error(creado.error.message);
    }
    const broadcastId = creado.data?.id;
    if (!broadcastId) {
      throw new Error('Resend no devolvio un id de broadcast.');
    }

    const enviado = await this.resend.broadcasts.send(broadcastId);
    if (enviado.error) {
      throw new Error(enviado.error.message);
    }

    return broadcastId;
  }
}
