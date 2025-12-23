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
      throw new BadRequestException('Valor invalido');
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
      throw new BadRequestException('Valor invalido');
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


  async reserve(userId: string, amount: number, description: string, referenceId?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Valor invalido');
    }
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.balance) < amount) {
      throw new BadRequestException('Saldo insuficiente');
    }
    return this.prisma.wallet.update({
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

  async release(userId: string, amount: number, description: string, referenceId?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Valor invalido');
    }
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.locked) < amount) {
      throw new BadRequestException('Saldo em processamento insuficiente');
    }
    return this.prisma.wallet.update({
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

  async finalizeWithdraw(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Valor invalido');
    }
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.locked) < amount) {
      throw new BadRequestException('Saldo em processamento insuficiente');
    }
    return this.prisma.wallet.update({
      where: { userId },
      data: {
        locked: { decrement: amount },
      },
      include: { statements: { orderBy: { createdAt: 'desc' } } },
    });
  }

}
