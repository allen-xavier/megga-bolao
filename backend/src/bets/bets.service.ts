import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { TransparencyService } from '../transparency/transparency.service';

@Injectable()
export class BetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transparency: TransparencyService,
  ) {}

  async create(bolaoId: string, userId: string, dto: CreateBetDto) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id: bolaoId },
      select: {
        id: true,
        name: true,
        ticketPrice: true,
        startsAt: true,
        closedAt: true,
      },
    });

    if (!bolao) {
      throw new NotFoundException('Bolão não encontrado');
    }

    if (bolao.closedAt) {
      throw new BadRequestException('Este bolão já foi encerrado');
    }

    const numbers = this.resolveNumbers(dto);
    const ticketPrice = Number(bolao.ticketPrice);

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || Number(wallet.balance) < ticketPrice) {
        throw new BadRequestException('Saldo insuficiente para realizar a aposta');
      }

      const transparency = await this.transparency.ensureRecord(tx, bolao.id);

      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: ticketPrice },
          statements: {
            create: {
              amount: -ticketPrice,
              description: `Aposta no bolão ${bolao.name}`,
              type: PaymentType.WITHDRAW,
              referenceId: bolao.id,
            },
          },
        },
        include: {
          statements: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      });

      const bet = await tx.bet.create({
        data: {
          bolaoId,
          userId,
          numbers,
          isSurprise: dto.isSurprise ?? false,
          transparency: {
            connect: { id: transparency.id },
          },
        },
        include: {
          user: { select: { fullName: true, city: true, state: true } },
        },
      });

      return { bet, wallet: updatedWallet, transparency };
    });

    await this.transparency.appendSnapshot(result.transparency.filePath, {
      betId: result.bet.id,
      firstName: (result.bet.user.fullName ?? 'Participante').split(' ')[0],
      city: result.bet.user.city,
      state: result.bet.user.state,
      mode: result.bet.isSurprise ? 'surpresinha' : 'manual',
      numbers: result.bet.numbers,
      createdAt: result.bet.createdAt,
    });

    return {
      bet: {
        ...result.bet,
      },
      wallet: {
        id: result.wallet.id,
        balance: result.wallet.balance,
        locked: result.wallet.locked,
        statements: result.wallet.statements,
      },
    };
  }

  private resolveNumbers(dto: CreateBetDto): number[] {
    if (dto.isSurprise || !dto.numbers?.length) {
      return this.generateSurpriseNumbers();
    }

    const unique = Array.from(new Set(dto.numbers));
    if (unique.length !== 10) {
      throw new BadRequestException('A aposta deve conter exatamente 10 números únicos');
    }

    const invalid = unique.some((number) => number < 1 || number > 60);
    if (invalid) {
      throw new BadRequestException('Os números devem estar entre 1 e 60');
    }

    return [...unique].sort((a, b) => a - b);
  }

  private generateSurpriseNumbers(): number[] {
    const pool = Array.from({ length: 60 }, (_, index) => index + 1);
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 10).sort((a, b) => a - b);
  }
}
