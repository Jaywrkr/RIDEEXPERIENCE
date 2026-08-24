import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Crea el primer administrador del panel. No hay endpoint publico de
 * registro de admins a proposito (el alcance cotizado es un solo panel
 * por cliente) — se crea por seed o manualmente en la base de datos.
 *
 * Uso: ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NOMBRE=... npx prisma db seed
 */
async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@rideexperience.local';
  const password = process.env.ADMIN_PASSWORD ?? 'cambiar-esta-clave';
  const nombre = process.env.ADMIN_NOMBRE ?? 'Administrador';

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, nombre },
  });

  console.log(`Admin listo: ${admin.email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      'ADMIN_PASSWORD no fue definido: se uso una clave por defecto insegura. ' +
        'Cambiarla antes de usar en produccion.',
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
