import { Controller, Get, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("winners")
export class WinnersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("latest")
  async latest(@Query("limit") limitParam?: string) {
    const take = Math.min(Math.max(Number(limitParam) || 10, 1), 50);
    const results = await this.prisma.prizeResultWinner.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        user: { select: { fullName: true, city: true, state: true } },
        prizeResult: {
          select: {
            prizeType: true,
            bolaoResult: {
              select: { bolao: { select: { name: true } }, closedAt: true },
            },
          },
        },
      },
    });

    return results.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      prizeType: r.prizeResult.prizeType,
      bolaoName: r.prizeResult.bolaoResult?.bolao?.name ?? null,
      closedAt: r.prizeResult.bolaoResult?.closedAt ?? null,
      winner: {
        name: r.user.fullName,
        city: r.user.city,
        state: r.user.state,
      },
      createdAt: r.createdAt,
    }));
  }
}
