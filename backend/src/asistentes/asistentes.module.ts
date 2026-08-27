import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { AsistentesController } from './asistentes.controller';
import { AsistentesService } from './asistentes.service';

@Module({
  imports: [AuthModule, NotificacionesModule],
  controllers: [AsistentesController],
  providers: [AsistentesService],
})
export class AsistentesModule {}
