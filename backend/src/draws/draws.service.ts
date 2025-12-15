import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PaymentType, PrizeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDrawDto } from './dto/create-draw.dto';
import { RankingsService } from '../rankings/rankings.service';
import { ListDrawsDto } from './dto/list-draws.dto';

@Injectable()
export class DrawsService {
  constructor(private readonly prisma: PrismaService, private readonly rankings: RankingsService) {}

  async list(filters: ListDrawsDto) {
    const where: any = {};
    if (filters.from || filters.to) {
      where.drawnAt = {};
      if (filters.from) where.drawnAt.gte = new Date(filters.from);
      if (filters.to) where.drawnAt.lte = new Date(filters.to);
    }

    return this.prisma.draw.findMany({
      where,
      include: { bolao: { select: { id: true, name: true } } },
      orderBy: { drawnAt: 'desc' },
    });
  }

  async create(dto: CreateDrawDto, userId: string) {
    const drawnAt = new Date(dto.drawnAt);
    const bolaoAtivo = await this.prisma.bolao.findFirst({
      where: {
        startsAt: { lte: drawnAt },
        OR: [{ closedAt: null }, { closedAt: { gte: drawnAt } }],
      },
      orderBy: { startsAt: 'desc' },
      include: { prizes: true },
    });

    if (!bolaoAtivo) {
      throw new BadRequestException('Nenhum bolão em andamento para a data informada');
    }

    const draw = await this.prisma.draw.create({
      data: {
        drawnAt,
        numbers: dto.numbers,
        createdById: userId,
        bolaoId: bolaoAtivo.id,
      },
    });
    await this.rankings.recalculateForDraw(draw.id);

    await this.processPrizesAndClosure(bolaoAtivo.id);

    return { ...draw, bolao: bolaoAtivo };
  }

  async delete(id: string) {
    const existing = await this.prisma.draw.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Sorteio não encontrado');
    }
    await this.prisma.draw.delete({ where: { id } });
    return { deleted: true };
  }

  private async processPrizesAndClosure(bolaoId: string) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id: bolaoId },
      include: {
        prizes: true,
        draws: { orderBy: { drawnAt: 'asc' } },
        bets: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!bolao) return;

    // Union de todos os números sorteados
    const allNumbersSet = new Set<number>();
    bolao.draws.forEach((d) => d.numbers.forEach((n) => allNumbersSet.add(n)));
    const firstDrawNumbers = bolao.draws[0]?.numbers ?? [];

    const hitsByBet = bolao.bets.map((bet) => {
      const cumulativeHits = bet.numbers.filter((n) => allNumbersSet.has(n)).length;
      const firstDrawHits = bet.numbers.filter((n) => firstDrawNumbers.includes(n)).length;
      return { bet, cumulativeHits, firstDrawHits };
    });

    const hasTen = hitsByBet.some((item) => item.cumulativeHits >= 10);
    const shouldClose = hasTen && !bolao.closedAt;
    const closedAt = shouldClose ? new Date() : bolao.closedAt;

    if (!shouldClose) {
      return;
    }

    // Sena pot global
    const senaPot =
      (await this.prisma.senaPot.findUnique({ where: { id: 'global' } })) ||
      (await this.prisma.senaPot.create({ data: { id: 'global', amount: 0 } }));

    const getPrizeValue = (type: PrizeType) => {
      const prize = bolao.prizes.find((p) => p.type === type);
      if (!prize) return 0;
      const fixed = Number(prize.fixedValue ?? 0);
      const pct = Number(prize.percentage ?? 0);
      if (fixed > 0) return fixed;
      return (pct / 100) * Number(bolao.guaranteedPrize ?? 0);
    };

    const winners: Record<string, { bets: typeof hitsByBet; total: number }> = {} as any;

    winners[PrizeType.PE_QUENTE] = {
      bets: hitsByBet.filter((b) => b.cumulativeHits >= 10),
      total: getPrizeValue(PrizeType.PE_QUENTE),
    };

    const minHits = Math.min(...hitsByBet.map((b) => b.cumulativeHits));
    winners[PrizeType.PE_FRIO] = {
      bets: hitsByBet.filter((b) => b.cumulativeHits === minHits),
      total: getPrizeValue(PrizeType.PE_FRIO),
    };

    winners[PrizeType.CONSOLACAO] = {
      bets: hitsByBet.filter((b) => b.cumulativeHits === 9),
      total: getPrizeValue(PrizeType.CONSOLACAO),
    };

    winners[PrizeType.OITO_ACERTOS] = {
      bets: hitsByBet.filter((b) => b.cumulativeHits === 8),
      total: getPrizeValue(PrizeType.OITO_ACERTOS),
    };

    const maxFirst = Math.max(...hitsByBet.map((b) => b.firstDrawHits));
    winners[PrizeType.LIGEIRINHO] = {
      bets: hitsByBet.filter((b) => b.firstDrawHits === maxFirst && maxFirst > 0),
      total: getPrizeValue(PrizeType.LIGEIRINHO),
    };

    const senaWinners = hitsByBet.filter((b) => b.firstDrawHits === 6);
    const senaPrizeBase = getPrizeValue(PrizeType.SENA_PRIMEIRO);
    let senaPotAmount = Number(senaPot.amount);
    let senaTotal = senaPrizeBase + senaPotAmount;
    if (senaWinners.length === 0) {
      senaPotAmount += senaPrizeBase * 0.8;
      senaTotal = 0;
    }

    const prizeEntries: Array<{ type: PrizeType; bets: typeof hitsByBet; total: number }> = [
      { type: PrizeType.PE_QUENTE, bets: winners[PrizeType.PE_QUENTE].bets, total: winners[PrizeType.PE_QUENTE].total },
      { type: PrizeType.PE_FRIO, bets: winners[PrizeType.PE_FRIO].bets, total: winners[PrizeType.PE_FRIO].total },
      { type: PrizeType.CONSOLACAO, bets: winners[PrizeType.CONSOLACAO].bets, total: winners[PrizeType.CONSOLACAO].total },
      { type: PrizeType.OITO_ACERTOS, bets: winners[PrizeType.OITO_ACERTOS].bets, total: winners[PrizeType.OITO_ACERTOS].total },
      { type: PrizeType.LIGEIRINHO, bets: winners[PrizeType.LIGEIRINHO].bets, total: winners[PrizeType.LIGEIRINHO].total },
      { type: PrizeType.SENA_PRIMEIRO, bets: senaWinners, total: senaTotal },
    ];

    await this.prisma.$transaction(async (tx) => {
      await tx.bolao.update({ where: { id: bolao.id }, data: { closedAt: closedAt ?? new Date() } });

      const bolaoResult = await tx.bolaoResult.create({
        data: {
          bolaoId: bolao.id,
          closedAt: closedAt ?? new Date(),
        },
      });

      for (const prize of prizeEntries) {
        if (!prize.total || prize.total <= 0 || prize.bets.length === 0) continue;
        const perWinner = prize.total / prize.bets.length;
        const prizeResult = await tx.prizeResult.create({
          data: {
            bolaoResultId: bolaoResult.id,
            prizeType: prize.type,
            totalValue: prize.total,
          },
        });

        for (const item of prize.bets) {
          await tx.prizeResultWinner.create({
            data: {
              prizeResultId: prizeResult.id,
              betId: item.bet.id,
              userId: item.bet.user.id,
              amount: perWinner,
            },
          });

          await tx.wallet.update({
            where: { userId: item.bet.user.id },
            data: {
              balance: { increment: perWinner },
              statements: {
                create: {
                  amount: perWinner,
                  description: `Prêmio ${prize.type} - bolão ${bolao.name}`,
                  type: PaymentType.PRIZE,
                  referenceId: bolao.id,
                },
              },
            },
          });
        }
      }

      await tx.senaPot.upsert({
        where: { id: 'global' },
        update: { amount: senaPotAmount },
        create: { id: 'global', amount: senaPotAmount },
      });
    });
  }
}
