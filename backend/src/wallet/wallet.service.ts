import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string) {
    return this.prisma.wallet.findUnique({
      where: { userId },
      include: { statements: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async credit(userId: string, amount: number, description: string, referenceId?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Valor inválido');
    }
    const wallet = await this.prisma.wallet.update({
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

  async debit(userId: string, amount: number, description: string, referenceId?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Valor inválido');
    }
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.balance) < amount) {
      throw new BadRequestException('Saldo insuficiente');
    }
    return this.prisma.wallet.update({
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
}
