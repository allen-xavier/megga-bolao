import { Injectable } from '@nestjs/common';
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
    const draw = await this.prisma.draw.create({
      data: {
        drawnAt: new Date(dto.drawnAt),
        numbers: dto.numbers,
        createdById: userId,
      },
    });
    await this.rankings.recalculateForDraw(draw.id);
    return draw;
  }
}
