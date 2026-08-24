import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.evento.update({ where: { id }, data: dto });
  }
}
