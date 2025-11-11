import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalRanking(limit = 20) {
    return this.prisma.bet.groupBy({
      by: ['userId'],
      _count: { _all: true },
      orderBy: { _count: { _all: 'desc' } },
      take: limit,
    });
  }

  async getRankingForBolao(bolaoId: string) {
    return this.prisma.bet.findMany({
      where: { bolaoId },
      include: {
        user: { select: { id: true, fullName: true, city: true, state: true } },
      },
    });
  }

  async recalculateForDraw(drawId: string) {
    // In a real implementation this would trigger complex scoring rules.
    // For now we just log the recalculation so that the workflow is explicit.
    // eslint-disable-next-line no-console
    console.log(`Recalculating rankings for draw ${drawId}`);
    return true;
  }
}
