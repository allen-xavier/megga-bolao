import { PrismaClient, UserRole, PrizeType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('user123');
  const user = await prisma.user.upsert({
    where: { phone: '+5511988887777' },
    update: {},
    create: {
      fullName: 'Usuário Teste',
      phone: '+5511988887777',
      cpf: '12345678901',
      cep: '01001000',
      address: 'Rua das Flores, 100',
      city: 'São Paulo',
      state: 'SP',
      pixKey: 'user@pix',
      passwordHash,
      acceptedTerms: true,
      wallet: { create: {} },
    },
  });

  const admin = await prisma.user.upsert({
    where: { phone: '+5511999999999' },
    update: {},
    create: {
      fullName: 'Administrador',
      phone: '+5511999999999',
      email: 'admin@meggabolao.com',
      cpf: '00000000000',
      cep: '00000000',
      address: 'Rua Admin, 123',
      city: 'São Paulo',
      state: 'SP',
      pixKey: 'admin@pix',
      passwordHash: await argon2.hash('admin123'),
      role: UserRole.ADMIN,
      acceptedTerms: true,
      wallet: { create: {} },
    },
  });

  const bolao = await prisma.bolao.create({
    data: {
      name: 'Bolão de Boas-Vindas',
      startsAt: new Date(Date.now() + 3600 * 1000),
      ticketPrice: 25,
      minimumQuotas: 10,
      guaranteedPrize: 1000,
      commissionPercent: 10,
      promotional: true,
      createdById: admin.id,
      prizes: {
        create: [
          { type: PrizeType.PE_QUENTE, percentage: 40 },
          { type: PrizeType.CONSOLACAO, percentage: 10 },
          { type: PrizeType.INDICACAO_DIRETA, percentage: 2 },
          { type: PrizeType.INDICACAO_INDIRETA, percentage: 1 },
        ],
      },
    },
  });

  const transparency = await prisma.transparencyFile.create({
    data: {
      bolaoId: bolao.id,
      filePath: `transparency/bolao-${bolao.id}.csv`,
    },
  });

  await prisma.bet.create({
    data: {
      userId: user.id,
      bolaoId: bolao.id,
      numbers: [1, 5, 12, 22, 34, 42, 48, 53, 55, 60],
      isSurprise: false,
      transparency: { connect: { id: transparency.id } },
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed executada com sucesso');
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
