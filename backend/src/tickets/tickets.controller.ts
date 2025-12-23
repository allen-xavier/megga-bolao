import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../users/decorators/current-user.decorator";
import { UserProfile } from "../users/entities/user.entity";
import { PrismaService } from "../prisma/prisma.service";

@Controller("tickets")
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listMine(
    @CurrentUser() user: UserProfile,
    @Query("bolao") bolao?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    const and: Prisma.BetWhereInput[] = [];
    const bolaoTerm = bolao?.trim();
    if (bolaoTerm) {
      and.push({
        OR: [
          { bolao: { name: { contains: bolaoTerm, mode: "insensitive" } } },
          { bolaoId: bolaoTerm },
        ],
      });
    }

    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const validFrom = fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined;
    const validTo = toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined;
    if (validFrom || validTo) {
      if (validFrom) validFrom.setHours(0, 0, 0, 0);
      if (validTo) validTo.setHours(23, 59, 59, 999);
      and.push({
        createdAt: {
          ...(validFrom ? { gte: validFrom } : {}),
          ...(validTo ? { lte: validTo } : {}),
        },
      });
    }

    const pageNumber = page ? Number(page) : 1;
    const perPageNumber = perPage ? Number(perPage) : 50;
    const safePage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
    const safePerPage = Number.isFinite(perPageNumber) && perPageNumber > 0 ? perPageNumber : 50;

    const where: Prisma.BetWhereInput = {
      userId: user.id,
      ...(and.length ? { AND: and } : {}),
    };

    return this.prisma.bet.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safePerPage,
      take: safePerPage,
      include: {
        bolao: {
          select: {
            id: true,
            name: true,
            startsAt: true,
            closedAt: true,
            ticketPrice: true,
            transparency: { select: { id: true } },
          },
        },
        prizeWinners: {
          select: {
            amount: true,
            hits: true,
            prizeResult: { select: { prizeType: true } },
          },
        },
      },
    });
  }
}
