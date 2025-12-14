import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDrawDto } from './dto/create-draw.dto';
import { RankingsService } from '../rankings/rankings.service';

@Injectable()
export class DrawsService {
  constructor(private readonly prisma: PrismaService, private readonly rankings: RankingsService) {}

  async list() {
    return this.prisma.draw.findMany({ orderBy: { drawnAt: 'desc' } });
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
