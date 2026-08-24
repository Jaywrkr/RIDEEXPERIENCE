import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AsistentesController } from './asistentes.controller';
import { AsistentesService } from './asistentes.service';

@Module({
  imports: [AuthModule],
  controllers: [AsistentesController],
  providers: [AsistentesService],
})
export class AsistentesModule {}
