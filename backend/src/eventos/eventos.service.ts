import { Injectable, NotFoundException } from '@nestjs/common';
import { EstadoRegistro, TipoNotificacion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  crear(dto: CreateEventoDto) {
    return this.prisma.evento.create({ data: dto });
  }

  listar() {
    return this.prisma.evento.findMany({ orderBy: { fechaInicio: 'asc' } });
  }

  async buscarUno(id: string) {
    const evento = await this.prisma.evento.findUnique({ where: { id } });
    if (!evento) {
      throw new NotFoundException('Evento no encontrado.');
    }
    return evento;
  }

  async actualizar(id: string, dto: UpdateEventoDto) {
    await this.buscarUno(id);
    const evento = await this.prisma.evento.update({ where: { id }, data: dto });

    // asistentes.service.ts solo crea la Notificacion de AVISO_PREVIO /
    // AVISO_FINAL de un asistente si el evento ya tenia esa fecha puesta
    // en el momento en que se registro. Alguien que se registro *antes*
    // de que el organizador definiera la fecha del aviso se quedaria sin
    // esa Notificacion para siempre. Por eso, cada vez que se guarda una
    // fecha de aviso: (1) se le crea la Notificacion pendiente a quien le
    // falte, y (2) se reprograma la de quien ya la tenia pero todavia no
    // se le envio -- asi el organizador puede mover la fecha sin miedo a
    // dejar gente sin avisar o mandarlo en el momento equivocado.
    if (dto.fechaAvisoPrevio !== undefined && evento.fechaAvisoPrevio) {
      await this.sincronizarAvisoMasivo(evento.id, TipoNotificacion.AVISO_PREVIO, evento.fechaAvisoPrevio);
    }
    if (dto.fechaAvisoFinal !== undefined && evento.fechaAvisoFinal) {
      await this.sincronizarAvisoMasivo(evento.id, TipoNotificacion.AVISO_FINAL, evento.fechaAvisoFinal);
    }

    return evento;
  }

  private async sincronizarAvisoMasivo(eventoId: string, tipo: TipoNotificacion, programadaPara: Date) {
    await this.prisma.notificacion.updateMany({
      where: { eventoId, tipo, estado: 'PENDIENTE' },
      data: { programadaPara },
    });

    const sinNotificacion = await this.prisma.asistente.findMany({
      where: {
        eventoId,
        estado: EstadoRegistro.REGISTRADO,
        notificaciones: { none: { tipo } },
      },
      select: { id: true },
    });
    if (sinNotificacion.length === 0) return;

    await this.prisma.notificacion.createMany({
      data: sinNotificacion.map((asistente) => ({
        tipo,
        eventoId,
        asistenteId: asistente.id,
        programadaPara,
      })),
    });
  }
}
