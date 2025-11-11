import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBolaoDto } from './dto/create-bolao.dto';
import { UpdateBolaoDto } from './dto/update-bolao.dto';

@Injectable()
export class BoloesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.bolao.findMany({
      include: { prizes: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.bolao.findUnique({
      where: { id },
      include: {
        prizes: true,
        bets: {
          include: {
            user: { select: { id: true, fullName: true, city: true, state: true } },
          },
        },
      },
    });
  }

  async create(dto: CreateBolaoDto, adminId: string) {
    this.ensurePrizeDistribution(dto);
    return this.prisma.bolao.create({
      data: {
        name: dto.name,
        startsAt: new Date(dto.startsAt),
        ticketPrice: dto.ticketPrice,
        minimumQuotas: dto.minimumQuotas,
        guaranteedPrize: dto.guaranteedPrize,
        commissionPercent: dto.commissionPercent ?? 0,
        promotional: dto.promotional ?? false,
        createdById: adminId,
        prizes: {
          create: dto.prizes.map((prize) => ({
            type: prize.type,
            percentage: prize.percentage ?? 0,
            fixedValue: prize.fixedValue,
            maxWinners: prize.maxWinners,
          })),
        },
      },
    });
  }

  async update(id: string, dto: UpdateBolaoDto) {
    if (dto.prizes) {
      this.ensurePrizeDistribution(dto as CreateBolaoDto);
    }
    return this.prisma.bolao.update({
      where: { id },
      data: {
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        prizes: dto.prizes
          ? {
              deleteMany: {},
              create: dto.prizes.map((prize) => ({
                type: prize.type,
                percentage: prize.percentage ?? 0,
                fixedValue: prize.fixedValue,
                maxWinners: prize.maxWinners,
              })),
            }
          : undefined,
      },
      include: { prizes: true },
    });
  }

  private ensurePrizeDistribution(dto: CreateBolaoDto) {
    const totalPercent = dto.prizes.reduce((acc, prize) => acc + (prize.percentage ?? 0), 0);
    const commission = dto.commissionPercent ?? 0;
    if (totalPercent + commission > 100) {
      throw new BadRequestException('Soma das premiações e comissão não pode exceder 100%');
    }
  }
}
