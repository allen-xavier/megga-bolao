import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RankingEntry {
  userId: string;
  fullName: string;
  city: string;
  state: string;
  totalBets: number;
  totalHits: number;
  bestBetHits: number;
  lastBetAt: Date;
  totalPrizesWon: number;
  totalPrizeValue: number;
}

export interface RankingSnapshot {
  lastDraw: { id: string; drawnAt: Date; numbers: number[] } | null;
  entries: RankingEntry[];
}

export type BolaoRankingSnapshot = RankingSnapshot & {
  bolao?: { id: string; name: string } | null;
};

@Injectable()
export class RankingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalRanking(limit = 20): Promise<RankingSnapshot> {
    const lastDraw = await this.prisma.draw.findFirst({ orderBy: { drawnAt: 'desc' } });
    if (!lastDraw) {
      return { lastDraw: null, entries: [] };
    }

    const prizeStats = await this.getPrizeStats(lastDraw.drawnAt);
    const bets = await this.prisma.bet.findMany({
      where: { createdAt: { lte: lastDraw.drawnAt } },
      include: {
        user: { select: { id: true, fullName: true, city: true, state: true } },
      },
    });

    const entries = this.buildRankingEntries(bets, lastDraw.numbers, prizeStats).slice(0, limit);

    return {
      lastDraw: {
        id: lastDraw.id,
        drawnAt: lastDraw.drawnAt,
        numbers: lastDraw.numbers,
      },
      entries,
    };
  }

  async getRankingForBolao(bolaoId: string, limit = 50): Promise<BolaoRankingSnapshot> {
    const [lastDraw, bolao] = await Promise.all([
      this.prisma.draw.findFirst({ orderBy: { drawnAt: 'desc' } }),
      this.prisma.bolao.findUnique({ where: { id: bolaoId }, select: { id: true, name: true } }),
    ]);

    const cutoff = lastDraw?.drawnAt ?? null;
    const prizeStats = await this.getPrizeStats(cutoff, bolaoId);
    const bets = await this.prisma.bet.findMany({
      where: {
        bolaoId,
        ...(lastDraw ? { createdAt: { lte: lastDraw.drawnAt } } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, city: true, state: true } },
      },
    });

    const entries = this.buildRankingEntries(bets, lastDraw?.numbers ?? [], prizeStats).slice(0, limit);

    return {
      bolao,
      lastDraw: lastDraw
        ? { id: lastDraw.id, drawnAt: lastDraw.drawnAt, numbers: lastDraw.numbers }
        : null,
      entries,
    };
  }

  async recalculateForDraw(drawId: string) {
    const draw = await this.prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) {
      return { lastDraw: null, entries: [] };
    }

    const bets = await this.prisma.bet.findMany({
      where: { createdAt: { lte: draw.drawnAt } },
      include: {
        user: { select: { id: true, fullName: true, city: true, state: true } },
      },
    });

    const prizeStats = await this.getPrizeStats(draw.drawnAt);
    const entries = this.buildRankingEntries(bets, draw.numbers, prizeStats);
    return {
      lastDraw: { id: draw.id, drawnAt: draw.drawnAt, numbers: draw.numbers },
      entries,
    };
  }

  private buildRankingEntries(
    bets: Array<{
      userId: string;
      numbers: number[];
      createdAt: Date;
      user: { id: string; fullName: string; city: string; state: string };
    }>,
    drawNumbers: number[],
    prizeStats: Map<
      string,
      {
        totalPrizesWon: number;
        totalPrizeValue: number;
      }
    >,
  ): RankingEntry[] {
    const scoreboard = new Map<string, RankingEntry>();
    const numbers = new Set(drawNumbers);

    for (const bet of bets) {
      const hits = numbers.size
        ? bet.numbers.filter((number) => numbers.has(number)).length
        : 0;

      const current = scoreboard.get(bet.userId);
      const prizes = prizeStats.get(bet.userId);
      const entry: RankingEntry = current ?? {
        userId: bet.userId,
        fullName: bet.user.fullName,
        city: bet.user.city,
        state: bet.user.state,
        totalBets: 0,
        totalHits: 0,
        bestBetHits: 0,
        lastBetAt: bet.createdAt,
        totalPrizesWon: prizes?.totalPrizesWon ?? 0,
        totalPrizeValue: prizes?.totalPrizeValue ?? 0,
      };

      entry.totalBets += 1;
      entry.totalHits += hits;
      entry.bestBetHits = Math.max(entry.bestBetHits, hits);
      entry.lastBetAt = entry.lastBetAt > bet.createdAt ? entry.lastBetAt : bet.createdAt;

      scoreboard.set(bet.userId, entry);
    }

    return Array.from(scoreboard.values()).sort((a, b) => {
      if (b.bestBetHits !== a.bestBetHits) {
        return b.bestBetHits - a.bestBetHits;
      }
      if (b.totalHits !== a.totalHits) {
        return b.totalHits - a.totalHits;
      }
      if (b.totalBets !== a.totalBets) {
        return b.totalBets - a.totalBets;
      }
      return b.lastBetAt.getTime() - a.lastBetAt.getTime();
    });
  }

  private async getPrizeStats(cutoff: Date | null, bolaoId?: string) {
    const winners = await this.prisma.prizeResultWinner.findMany({
      where: {
        ...(cutoff ? { createdAt: { lte: cutoff } } : {}),
        ...(bolaoId
          ? {
              prizeResult: {
                bolaoResult: { bolaoId },
              },
            }
          : {}),
      },
      select: {
        userId: true,
        amount: true,
      },
    });

    const map = new Map<
      string,
      {
        totalPrizesWon: number;
        totalPrizeValue: number;
      }
    >();

    for (const w of winners) {
      const current = map.get(w.userId) ?? { totalPrizesWon: 0, totalPrizeValue: 0 };
      current.totalPrizesWon += 1;
      current.totalPrizeValue += Number(w.amount ?? 0);
      map.set(w.userId, current);
    }

    return map;
  }
}
