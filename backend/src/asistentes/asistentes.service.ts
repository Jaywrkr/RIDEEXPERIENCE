import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EstadoRegistro, TipoNotificacion } from '@prisma/client';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { conCodigo } from './codigo.util';
import { CreateAsistenteDto } from './dto/create-asistente.dto';

@Injectable()
export class AsistentesService {
  private readonly logger = new Logger(AsistentesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  async registrar(eventoId: string, dto: CreateAsistenteDto) {
    const evento = await this.prisma.evento.findUnique({ where: { id: eventoId } });
    if (!evento) {
      throw new NotFoundException('El evento indicado no existe.');
    }

    // Al retirarse la cedula, el correo es la clave natural del asistente:
    // es lo unico que queda para impedir una segunda inscripcion de la
    // misma persona.
    const yaRegistrado = await this.prisma.asistente.findUnique({
      where: { evento_correo_unico: { eventoId, correo: dto.correo } },
    });
    if (yaRegistrado) {
      throw new ConflictException('Este correo ya esta registrado en este evento.');
    }

    // El registro crea de una vez la notificacion de confirmacion
    // (pendiente de envio, Semana 4 la conecta a un correo real) y, si el
    // evento ya tiene fechas de aviso configuradas, las otras dos.
    const asistente = await this.prisma.asistente.create({
      data: {
        ...dto,
        eventoId,
        notificaciones: {
          create: [
            { tipo: TipoNotificacion.CONFIRMACION, eventoId, programadaPara: new Date() },
            ...(evento.fechaAvisoPrevio
              ? [
                  {
                    tipo: TipoNotificacion.AVISO_PREVIO,
                    eventoId,
                    programadaPara: evento.fechaAvisoPrevio,
                  },
                ]
              : []),
            ...(evento.fechaAvisoFinal
              ? [
                  {
                    tipo: TipoNotificacion.AVISO_FINAL,
                    eventoId,
                    programadaPara: evento.fechaAvisoFinal,
                  },
                ]
              : []),
          ],
        },
      },
    });

    // El correo de confirmacion se dispara ahora mismo, DENTRO de esta
    // misma invocacion, en vez de esperar al cron: en el deploy serverless
    // de Vercel el proceso muere apenas se responde la request (sin
    // "esperar de fondo" como en un servidor tradicional), asi que un
    // fire-and-forget sin await se arriesga a que Vercel mate la funcion
    // antes de que el correo salga. Y el cron de notificaciones corre una
    // sola vez por dia (ver backend/vercel.json) -- sin este await, la
    // persona podria esperar hasta 24hs por un correo que tiene que
    // sentirse inmediato.
    //
    // Un fallo de correo (Resend caido, typo en el dominio, etc.) no debe
    // tumbar el registro, que ya quedo guardado en la base: por eso el
    // try/catch, aunque procesarPendientes ya atrapa el error por
    // notificacion individualmente y la deja en FALLIDA para que el cron
    // diario la reintente.
    try {
      await this.notificaciones.procesarPendientes();
    } catch (error) {
      this.logger.error(`No se pudo procesar notificaciones tras el registro: ${(error as Error).message}`);
    }

    return conCodigo(asistente);
  }

  async listarPorEvento(eventoId: string) {
    const asistentes = await this.prisma.asistente.findMany({
      where: { eventoId },
      orderBy: { createdAt: 'desc' },
    });
    return asistentes.map(conCodigo);
  }

  async contarPorEvento(eventoId: string) {
    return this.prisma.asistente.count({
      where: { eventoId, estado: EstadoRegistro.REGISTRADO },
    });
  }

  async buscarUno(eventoId: string, asistenteId: string) {
    const asistente = await this.prisma.asistente.findFirst({
      where: { id: asistenteId, eventoId },
      include: { notificaciones: true },
    });
    if (!asistente) {
      throw new NotFoundException('Asistente no encontrado en este evento.');
    }
    return conCodigo(asistente);
  }

  // Check-in en la puerta el dia del evento. Alterna: si ya tenia
  // llegada marcada, la quita (por si se toco por error); si no, la
  // marca con la hora actual.
  async alternarLlegada(eventoId: string, asistenteId: string) {
    const asistente = await this.prisma.asistente.findFirst({
      where: { id: asistenteId, eventoId },
    });
    if (!asistente) {
      throw new NotFoundException('Asistente no encontrado en este evento.');
    }
    const actualizado = await this.prisma.asistente.update({
      where: { id: asistenteId },
      data: { llegadaEn: asistente.llegadaEn ? null : new Date() },
    });
    return conCodigo(actualizado);
  }
}
