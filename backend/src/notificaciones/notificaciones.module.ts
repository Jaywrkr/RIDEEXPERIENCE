import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailerService } from './mailer.service';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesScheduler } from './notificaciones.scheduler';
import { NotificacionesService } from './notificaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificacionesController],
  providers: [MailerService, NotificacionesService, NotificacionesScheduler],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
