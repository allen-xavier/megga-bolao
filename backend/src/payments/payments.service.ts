import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, PaymentType, Prisma } from '@prisma/client';
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
    await this.walletService.credit(payment.userId, Number(payment.amount), 'Deposito confirmado', payment.id);
    return payment;
  }

  async requestWithdraw(userId: string, dto: RequestWithdrawDto) {
    if (dto.amount < 50) {
      throw new BadRequestException('Saque minimo de R$ 50,00');
    }
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
        status: PaymentStatus.PROCESSING,
        metadata: { note: dto.note, auto: !requiresApproval, requiresApproval },
      },
    });

    await this.walletService.reserve(userId, dto.amount, 'Saque solicitado', payment.id);
    if (!requiresApproval) {
      return this.completeWithdraw(payment.id);
    }

    return payment;
  }

  async completeWithdraw(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.type !== PaymentType.WITHDRAW) {
      throw new NotFoundException('Saque nao encontrado');
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }
    if (payment.status === PaymentStatus.CANCELED || payment.status === PaymentStatus.FAILED) {
      throw new BadRequestException('Saque ja finalizado');
    }
    await this.walletService.finalizeWithdraw(payment.userId, Number(payment.amount));
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.COMPLETED, processedAt: new Date() },
    });
  }

  async failWithdraw(paymentId: string, reason?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.type !== PaymentType.WITHDRAW) {
      throw new NotFoundException('Saque nao encontrado');
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Saque ja concluido');
    }
    if (payment.status === PaymentStatus.CANCELED || payment.status === PaymentStatus.FAILED) {
      return payment;
    }
    await this.walletService.release(payment.userId, Number(payment.amount), 'Saque estornado', payment.id);
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        processedAt: new Date(),
        metadata: { ...(payment.metadata as any), reason },
      },
    });
  }

  async listWithdraws(status?: PaymentStatus, userId?: string) {
    const where: Prisma.PaymentWhereInput = { type: PaymentType.WITHDRAW };
    if (status) {
      where.status = status;
    }
    if (userId) {
      where.userId = userId;
    }
    return this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            cpf: true,
            pixKey: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async listUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
