import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protege las rutas del panel administrativo: requiere Bearer token valido. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
