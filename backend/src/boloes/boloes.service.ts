import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBolaoDto } from "./dto/create-bolao.dto";
import { UpdateBolaoDto } from "./dto/update-bolao.dto";
import { toSaoPauloDate } from "../common/timezone.util";

@Injectable()
export class BoloesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.bolao.findMany({
      include: { prizes: true, transparency: true },
      orderBy: { startsAt: "asc" },
    });
  }

  async findOne(id: string) {
    const bolao = await this.prisma.bolao.findUnique({
      where: { id },
      include: {
        prizes: true,
        transparency: true,
        draws: { orderBy: { drawnAt: "desc" } },
        bolaoResults: {
          include: {
            prizes: {
              include: {
                winners: {
                  include: {
                    bet: true,
                    user: { select: { id: true, fullName: true } },
                  },
                },
              },
            },
          },
        },
        bets: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, fullName: true, city: true, state: true } },
          },
        },
      },
    });

    if (!bolao) return null;

    const senaPot = await this.prisma.senaPot.findUnique({ where: { id: "global" } });
    const potTarget = await this.prisma.bolao.findFirst({
      where: { closedAt: null },
      orderBy: { startsAt: "asc" },
      select: { id: true },
    });
    const senaPotApplied = potTarget?.id === bolao.id ? Number(senaPot?.amount ?? 0) : 0;
    const livePrizes = !bolao.closedAt ? this.computeLivePrizes(bolao) : [];

    return {
      ...bolao,
      senaPot: senaPot?.amount ?? 0,
      senaPotApplied,
      livePrizes,
    };
  }

  async create(dto: CreateBolaoDto, adminId: string) {
    this.ensurePrizeDistribution(dto);
    return this.prisma.bolao.create({
      data: {
        name: dto.name,
        startsAt: toSaoPauloDate(dto.startsAt),
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
        startsAt: dto.startsAt ? toSaoPauloDate(dto.startsAt) : undefined,
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

  async remove(id: string) {
    await this.prisma.bolao.delete({ where: { id } });
    return { deleted: true };
  }

  private ensurePrizeDistribution(dto: CreateBolaoDto) {
    const totalPercent = dto.prizes.reduce((acc, prize) => acc + (prize.percentage ?? 0), 0);
    const commission = dto.commissionPercent ?? 0;
    if (totalPercent + commission > 100) {
      throw new BadRequestException("Soma das premiacoes e comissao nao pode exceder 100%");
    }
  }

  private getPrizePool(bolao: any) {
    const totalCollected = (bolao.bets?.length ?? 0) * Number(bolao.ticketPrice ?? 0);
    const commissionPercent = Number(bolao.commissionPercent ?? 0);
    const netPool = totalCollected * (1 - commissionPercent / 100);
    const guaranteedPrize = Number(bolao.guaranteedPrize ?? 0);
    return Math.max(guaranteedPrize, netPool);
  }

  private computeLivePrizes(bolao: any) {
    const drawsAsc = [...(bolao.draws ?? [])].sort(
      (a, b) => new Date(a.drawnAt).getTime() - new Date(b.drawnAt).getTime(),
    );
    if (drawsAsc.length === 0) return [];

    const firstDrawNumbers: number[] = Array.isArray(drawsAsc[0]?.numbers)
      ? drawsAsc[0].numbers.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
      : [];
    if (firstDrawNumbers.length === 0) return [];

    const prizePool = this.getPrizePool(bolao);
    const getPrizeValue = (type: string) => {
      const prizes = bolao.prizes ?? [];
      const prize = prizes.find((p: any) => p.type === type);
      if (!prize) return 0;
      const totalFixed = prizes.reduce((acc: number, p: any) => acc + Number(p.fixedValue ?? 0), 0);
      const totalPct = prizes.reduce((acc: number, p: any) => acc + Number(p.percentage ?? 0), 0);
      const variablePool = Math.max(prizePool - totalFixed, 0);
      const pctShare = totalPct > 0 ? Number(prize.percentage ?? 0) / totalPct : 0;
      return Number(prize.fixedValue ?? 0) + variablePool * pctShare;
    };

    const hitsByBet = (bolao.bets ?? []).map((bet: any) => {
      const numbers: number[] = (bet.numbers ?? []).map((n: any) => Number(n));
      const firstHits = numbers.filter((n) => firstDrawNumbers.includes(n)).length;
      return { bet, firstHits };
    });

    const liveResults: any[] = [];

    // LIGEIRINHO: maior numero de acertos no primeiro sorteio
    const maxFirst = Math.max(...hitsByBet.map((h: { firstHits: number }) => h.firstHits));
    const ligeirinho = hitsByBet.filter((h: { firstHits: number }) => h.firstHits === maxFirst && maxFirst > 0);
    if (ligeirinho.length > 0) {
      const total = getPrizeValue("LIGEIRINHO");
      if (total > 0) {
        const perWinner = total / ligeirinho.length;
        liveResults.push({
          prizeType: "LIGEIRINHO",
          totalValue: total,
          winners: ligeirinho.map((h: any) => ({
            bet: h.bet,
            user: h.bet.user,
            amount: perWinner,
            hits: h.firstHits,
          })),
        });
      }
    }

    // SENA_PRIMEIRO: acertou 6 no primeiro sorteio
    const senaPrimeiro = hitsByBet.filter((h: { firstHits: number }) => h.firstHits === 6);
    if (senaPrimeiro.length > 0) {
      const total = getPrizeValue("SENA_PRIMEIRO");
      if (total > 0) {
        const perWinner = total / senaPrimeiro.length;
        liveResults.push({
          prizeType: "SENA_PRIMEIRO",
          totalValue: total,
          winners: senaPrimeiro.map((h: any) => ({
            bet: h.bet,
            user: h.bet.user,
            amount: perWinner,
            hits: h.firstHits,
          })),
        });
      }
    }

    return liveResults;
  }
}
