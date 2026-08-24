import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AsistentesService } from './asistentes.service';
import { CreateAsistenteDto } from './dto/create-asistente.dto';

@Controller('eventos/:eventoId/asistentes')
export class AsistentesController {
  constructor(private readonly asistentesService: AsistentesService) {}

  // Publico: es el endpoint que consume el formulario de inscripcion.
  @Post()
  registrar(@Param('eventoId') eventoId: string, @Body() dto: CreateAsistenteDto) {
    return this.asistentesService.registrar(eventoId, dto);
  }

  // Panel administrativo: listado de asistentes.
  @UseGuards(JwtAuthGuard)
  @Get()
  listar(@Param('eventoId') eventoId: string) {
    return this.asistentesService.listarPorEvento(eventoId);
  }

  // Panel administrativo: total de registrados (contador simple).
  @UseGuards(JwtAuthGuard)
  @Get('total')
  contar(@Param('eventoId') eventoId: string) {
    return this.asistentesService.contarPorEvento(eventoId);
  }

  // Panel administrativo: consulta individual.
  @UseGuards(JwtAuthGuard)
  @Get(':asistenteId')
  buscarUno(
    @Param('eventoId') eventoId: string,
    @Param('asistenteId') asistenteId: string,
  ) {
    return this.asistentesService.buscarUno(eventoId, asistenteId);
  }
}
