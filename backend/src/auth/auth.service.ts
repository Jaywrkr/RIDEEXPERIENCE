import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });

    // Mismo mensaje exista o no el correo, para no filtrar que emails
    // estan registrados como administradores.
    const credencialesInvalidas = () =>
      new UnauthorizedException('Correo o contrasena incorrectos.');

    if (!admin) throw credencialesInvalidas();

    const passwordValido = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!passwordValido) throw credencialesInvalidas();

    const payload: JwtPayload = { sub: admin.id, email: admin.email };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      admin: { id: admin.id, email: admin.email, nombre: admin.nombre },
    };
  }
}
