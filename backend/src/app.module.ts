import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AsistentesModule } from './asistentes/asistentes.module';
import { AuthModule } from './auth/auth.module';
import { EventosModule } from './eventos/eventos.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EventosModule,
    AsistentesModule,
  ],
})
export class AppModule {}
