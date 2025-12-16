import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBetDto } from './dto/create-bet.dto';
import { TransparencyService } from '../transparency/transparency.service';
import { EventsService } from '../events/events.service';

type BetWithUser = Prisma.BetGetPayload<{
  include: { user: { select: { fullName: true; city: true; state: true } } };
}>;

@Injectable()
export class BetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transparency: TransparencyService,
    private readonly events: EventsService,
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

      // Affiliate config (singleton)
      const affiliateConfig =
        (await tx.affiliateConfig.findUnique({ where: { id: 'global' } })) ||
        (await tx.affiliateConfig.create({
          data: { id: 'global', firstLevelPercent: 2, secondLevelPercent: 1, firstBetBonus: 0 },
        }));

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

      const bet = (await tx.bet.create({
        data: {
          bolaoId,
          userId,
          numbers,
          isSurprise: dto.isSurprise ?? false,
          transparencyId: transparency.id,
        },
        include: {
          user: { select: { fullName: true, city: true, state: true } },
        },
      })) as BetWithUser;

      // Affiliate commissions and bonus
      const directRef = await tx.referral.findUnique({ where: { referredUserId: userId } });
      if (directRef) {
        const commission1 = (Number(affiliateConfig.firstLevelPercent) / 100) * ticketPrice;
        if (commission1 > 0) {
          await tx.wallet.update({
            where: { userId: directRef.userId },
            data: {
              balance: { increment: commission1 },
              statements: {
                create: {
                  amount: commission1,
                  description: `Comissão direta pela aposta de ${bet.user.fullName}`,
                  type: PaymentType.COMMISSION,
                  referenceId: bet.id,
                },
              },
            },
          });
        }

        // Indirect (level 2)
        const indirectRef = await tx.referral.findUnique({ where: { referredUserId: directRef.userId } });
        if (indirectRef) {
          const commission2 = (Number(affiliateConfig.secondLevelPercent) / 100) * ticketPrice;
          if (commission2 > 0) {
            await tx.wallet.update({
              where: { userId: indirectRef.userId },
              data: {
                balance: { increment: commission2 },
                statements: {
                  create: {
                    amount: commission2,
                    description: `Comissão indireta pela aposta de ${bet.user.fullName}`,
                    type: PaymentType.COMMISSION,
                    referenceId: bet.id,
                  },
                },
              },
            });
          }
        }

        // Bonus first bet for direct referrer
        const previousBets = await tx.bet.count({ where: { userId } });
        if (previousBets === 0) {
          const bonus = Number(affiliateConfig.firstBetBonus ?? 0);
          if (bonus > 0) {
            await tx.wallet.update({
              where: { userId: directRef.userId },
              data: {
                balance: { increment: bonus },
                statements: {
                  create: {
                    amount: bonus,
                    description: `Bônus pela primeira aposta de ${bet.user.fullName}`,
                    type: PaymentType.COMMISSION,
                    referenceId: bet.id,
                  },
                },
              },
            });
          }
        }
      }

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

    this.events.emit({ type: "bet.created", bolaoId, });

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
    if (dto.isSurprise) {
      if (dto.numbers && dto.numbers.length === 10) {
        return [...dto.numbers].sort((a, b) => a - b);
      }
      return this.generateSurpriseNumbers();
    }

    if (!dto.numbers?.length) {
      throw new BadRequestException('A aposta deve conter exatamente 10 numeros');
    }

    const unique = Array.from(new Set(dto.numbers));
    if (unique.length !== 10) {
      throw new BadRequestException('A aposta deve conter exatamente 10 numeros unicos');
    }

    const invalid = unique.some((number) => number < 1 || number > 60);
    if (invalid) {
      throw new BadRequestException('Os numeros devem estar entre 1 e 60');
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

