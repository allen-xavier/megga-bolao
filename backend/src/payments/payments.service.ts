import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStatus, PaymentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { RequestDepositDto } from './dto/request-deposit.dto';
import { RequestWithdrawDto } from './dto/request-withdraw.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly walletService: WalletService) {}

  async requestDeposit(userId: string, dto: RequestDepositDto) {
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: dto.amount,
        type: PaymentType.DEPOSIT,
        status: PaymentStatus.PENDING,
        metadata: { reference: dto.reference },
      },
    });
    return payment;
  }

  async confirmDeposit(paymentId: string) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.COMPLETED, processedAt: new Date() },
    });
    await this.walletService.credit(payment.userId, Number(payment.amount), 'Depósito confirmado', payment.id);
    return payment;
  }

  async requestWithdraw(userId: string, dto: RequestWithdrawDto) {
    const wallet = await this.walletService.getWallet(userId);
    if (!wallet || Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Saldo insuficiente para saque');
    }
    const requiresApproval = dto.amount > 150;
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: dto.amount,
        type: PaymentType.WITHDRAW,
        status: requiresApproval ? PaymentStatus.PENDING : PaymentStatus.PROCESSING,
        metadata: { note: dto.note, auto: !requiresApproval },
      },
    });

    if (!requiresApproval) {
      await this.walletService.debit(userId, dto.amount, 'Saque automático', payment.id);
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.COMPLETED, processedAt: new Date() },
      });
    }

    return payment;
  }

  async listUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
