import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoRegistro, TipoNotificacion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAsistenteDto } from './dto/create-asistente.dto';

@Injectable()
export class AsistentesService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(eventoId: string, dto: CreateAsistenteDto) {
    const evento = await this.prisma.evento.findUnique({ where: { id: eventoId } });
    if (!evento) {
      throw new NotFoundException('El evento indicado no existe.');
    }

    const yaRegistrado = await this.prisma.asistente.findUnique({
      where: { evento_cedula_unico: { eventoId, cedula: dto.cedula } },
    });
    if (yaRegistrado) {
      throw new ConflictException('Esta cedula ya esta registrada en este evento.');
    }

    // El registro crea de una vez la notificacion de confirmacion
    // (pendiente de envio, Semana 4 la conecta a un correo real) y, si el
    // evento ya tiene fechas de aviso configuradas, las otras dos.
    return this.prisma.asistente.create({
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
  }

  async listarPorEvento(eventoId: string) {
    return this.prisma.asistente.findMany({
      where: { eventoId },
      orderBy: { createdAt: 'desc' },
    });
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
    return asistente;
  }
}
