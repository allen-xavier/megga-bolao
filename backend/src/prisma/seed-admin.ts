import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function ensureUser(phone: string, password: string, role: UserRole, fullName: string) {
  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.upsert({
    where: { phone },
    update: {
      fullName,
      passwordHash,
      role,
      acceptedTerms: true,
    },
    create: {
      fullName,
      phone,
      email: role === UserRole.ADMIN ? 'admin@meggabolao.com' : undefined,
      cpf: role === UserRole.ADMIN ? '00000000000' : '12345678901',
      cep: role === UserRole.ADMIN ? '00000000' : '01001000',
      address: role === UserRole.ADMIN ? 'Rua Admin, 123' : 'Rua das Flores, 100',
      city: 'Sao Paulo',
      state: 'SP',
      pixKey: role === UserRole.ADMIN ? 'admin@pix' : 'user@pix',
      passwordHash,
      role,
      acceptedTerms: true,
      wallet: { create: {} },
    },
  });

  const defaultBalance = 1000;
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {
      balance: defaultBalance,
      locked: 0,
    },
    create: {
      userId: user.id,
      balance: defaultBalance,
      locked: 0,
    },
  });
}

async function main() {
  await ensureUser('+5511999999999', 'admin123', UserRole.ADMIN, 'Administrador');
  await ensureUser('+5511988887777', 'user123', UserRole.USER, 'Usuario Teste');
  // eslint-disable-next-line no-console
  console.log('Seed ensured for admin and default user.');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
