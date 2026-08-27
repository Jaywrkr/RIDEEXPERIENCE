// Entrypoint serverless para Vercel. El nombre "[...proxy]" hace que
// Vercel enrute cualquier /api/* a esta sola funcion, que reusa la misma
// app de Nest de src/ (mismos controladores, mismo main.ts en espiritu)
// en vez de duplicar logica. La app se arma una sola vez por instancia
// "tibia" de la funcion (cachedServer), no en cada request.
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';

let cachedServer: Express | undefined;

async function bootstrapServer(): Promise<Express> {
  if (!cachedServer) {
    const expressApp = express();
    // rawBody: true expone request.rawBody, que necesita el webhook de
    // Resend para verificar la firma Svix sobre los bytes exactos
    // recibidos (ver src/main.ts para el detalle).
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
      rawBody: true,
    });

    app.use(helmet());
    app.enableCors({ origin: process.env.CORS_ORIGIN || '*' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.setGlobalPrefix('api');

    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrapServer();
  server(req, res);
}
