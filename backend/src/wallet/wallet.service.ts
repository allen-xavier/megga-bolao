import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { statements: { orderBy: { createdAt: 'desc' } } },
    });
    if (!wallet) {
      return null;
    }
    const referenceIds = wallet.statements
      .map((statement) => statement.referenceId)
      .filter((value): value is string => Boolean(value));
    const receipts = referenceIds.length
      ? await this.prisma.payment.findMany({
          where: {
            id: { in: referenceIds },
            receiptPath: { not: null },
          },
          select: { id: true },
        })
      : [];
    const receiptSet = new Set(receipts.map((payment) => payment.id));
    const statements = wallet.statements.map((statement) => ({
      ...statement,
      receiptAvailable:
        statement.type === PaymentType.DEPOSIT || statement.type === PaymentType.WITHDRAW
          ? receiptSet.has(statement.referenceId ?? '')
          : false,
    }));
    return { ...wallet, statements };
  }

  async credit(userId: string, amount: number, description: string, referenceId?: string, tx?: Prisma.TransactionClient) {
    if (amount <= 0) {
      throw new BadRequestException('Valor invalido');
    }
    const prisma = (tx ?? this.prisma) as Prisma.TransactionClient;
    const wallet = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        statements: {
          create: {
            amount,
            description,
            type: PaymentType.DEPOSIT,
            referenceId,
          },
        },
      },
      include: { statements: { orderBy: { createdAt: 'desc' } } },
    });
    return wallet;
  }

  async debit(userId: string, amount: number, description: string, referenceId?: string, tx?: Prisma.TransactionClient) {
    if (amount <= 0) {
      throw new BadRequestException('Valor invalido');
    }
    const prisma = (tx ?? this.prisma) as Prisma.TransactionClient;
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.balance) < amount) {
      throw new BadRequestException('Saldo insuficiente');
    }
    return prisma.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
        statements: {
          create: {
            amount: -amount,
            description,
            type: PaymentType.WITHDRAW,
            referenceId,
          },
        },
      },
      include: { statements: { orderBy: { createdAt: 'desc' } } },
    });
  }


  async reserve(userId: string, amount: number, description: string, referenceId?: string, tx?: Prisma.TransactionClient) {
    if (amount <= 0) {
      throw new BadRequestException('Valor invalido');
    }
    const prisma = (tx ?? this.prisma) as Prisma.TransactionClient;
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.balance) < amount) {
      throw new BadRequestException('Saldo insuficiente');
    }
    return prisma.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
        locked: { increment: amount },
        statements: {
          create: {
            amount: -amount,
            description,
            type: PaymentType.WITHDRAW,
            referenceId,
          },
        },
      },
      include: { statements: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async release(userId: string, amount: number, description: string, referenceId?: string, tx?: Prisma.TransactionClient) {
    if (amount <= 0) {
      throw new BadRequestException('Valor invalido');
    }
    const prisma = (tx ?? this.prisma) as Prisma.TransactionClient;
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.locked) < amount) {
      throw new BadRequestException('Saldo em processamento insuficiente');
    }
    return prisma.wallet.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        locked: { decrement: amount },
        statements: {
          create: {
            amount,
            description,
            type: PaymentType.DEPOSIT,
            referenceId,
          },
        },
      },
      include: { statements: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async finalizeWithdraw(userId: string, amount: number, tx?: Prisma.TransactionClient) {
    if (amount <= 0) {
      throw new BadRequestException('Valor invalido');
    }
    const prisma = (tx ?? this.prisma) as Prisma.TransactionClient;
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.locked) < amount) {
      throw new BadRequestException('Saldo em processamento insuficiente');
    }
    return prisma.wallet.update({
      where: { userId },
      data: {
        locked: { decrement: amount },
      },
      include: { statements: { orderBy: { createdAt: 'desc' } } },
    });
  }

}
