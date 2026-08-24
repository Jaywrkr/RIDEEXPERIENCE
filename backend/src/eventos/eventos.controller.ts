import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { EventosService } from './eventos.service';

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  // Publico: el sitio de registro necesita mostrar agenda/lugar/fecha sin login.
  @Get()
  listar() {
    return this.eventosService.listar();
  }

  @Get(':id')
  buscarUno(@Param('id') id: string) {
    return this.eventosService.buscarUno(id);
  }

  // Solo el panel administrativo puede crear o editar eventos.
  @UseGuards(JwtAuthGuard)
  @Post()
  crear(@Body() dto: CreateEventoDto) {
    return this.eventosService.crear(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: UpdateEventoDto) {
    return this.eventosService.actualizar(id, dto);
  }
}
