import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = '+5511999999999';
  const exists = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (exists) {
    // eslint-disable-next-line no-console
    console.log('Admin user already exists, skipping seed');
    return;
  }

  const passwordHash = await argon2.hash('admin123');
  await prisma.user.create({
    data: {
      fullName: 'Administrador',
      phone: adminPhone,
      email: 'admin@meggabolao.com',
      cpf: '00000000000',
      cep: '00000000',
      address: 'Rua Admin, 123',
      city: 'São Paulo',
      state: 'SP',
      pixKey: 'admin@pix',
      passwordHash,
      role: UserRole.ADMIN,
      acceptedTerms: true,
      wallet: {
        create: {},
      },
    },
  });
  // eslint-disable-next-line no-console
  console.log('Admin user created with default credentials');
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
