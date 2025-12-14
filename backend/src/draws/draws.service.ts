import { BadRequestException, Injectable } from '@nestjs/common';
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
      if (filters.from) {
        where.drawnAt.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.drawnAt.lte = new Date(filters.to);
      }
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
    return { ...draw, bolao: bolaoAtivo };
  }
}
