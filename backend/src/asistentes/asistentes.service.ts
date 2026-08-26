import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoRegistro, TipoNotificacion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAsistenteDto } from './dto/create-asistente.dto';

// El correlativo de la base de datos (1, 2, 3...) empieza en 1 porque asi
// arranca cualquier secuencia de Postgres; el pasaporte visible arranca
// en 1001 porque asi lo pidio el cliente. El offset vive en un solo
// lugar para no repetirlo en cada método.
const OFFSET_CODIGO = 1000;

function conCodigo<T extends { numero: number }>(asistente: T): T & { codigo: string } {
  return { ...asistente, codigo: `ATT-${OFFSET_CODIGO + asistente.numero}` };
}

@Injectable()
export class AsistentesService {
  constructor(private readonly prisma: PrismaService) {}

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
