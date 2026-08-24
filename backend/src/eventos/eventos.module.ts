import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';

@Module({
  imports: [AuthModule],
  controllers: [EventosController],
  providers: [EventosService],
  exports: [EventosService],
})
export class EventosModule {}
