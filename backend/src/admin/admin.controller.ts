import { Controller, Get, ForbiddenException, UseGuards, Param, NotFoundException, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../users/decorators/current-user.decorator";
import { UserProfile, UserRole } from "../users/entities/user.entity";
import { PaymentType, Prisma } from "@prisma/client";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("stats")
  async stats(@CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException("Acesso restrito a administradores");
    }

    const bets = await this.prisma.bet.findMany({
      select: { bolao: { select: { ticketPrice: true } } },
    });
    const totalBets = bets.reduce((acc, item) => acc + Number(item.bolao.ticketPrice ?? 0), 0);

    const paid = await this.prisma.prizeResultWinner.aggregate({
      _sum: { amount: true },
    });
    const totalPaid = Number(paid._sum.amount ?? 0);

    const wallets = await this.prisma.wallet.aggregate({
      _sum: { balance: true },
    });
    const walletOutstanding = Number(wallets._sum.balance ?? 0);

    const adminBalance = totalBets - totalPaid;

    return {
      totalBets,
      totalPaid,
      adminBalance,
      walletOutstanding,
    };
  }

  @Get("users/:id/overview")
  async userOverview(@Param("id") id: string, @CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException("Acesso restrito a administradores");
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        cpf: true,
        city: true,
        state: true,
        pixKey: true,
        acceptedTerms: true,
        createdAt: true,
      },
    });

    if (!userRecord) {
      throw new NotFoundException("Usuario nao encontrado");
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: id },
      select: { balance: true, locked: true, updatedAt: true },
    });

    const bets = await this.prisma.bet.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: {
        bolao: {
          select: {
            id: true,
            name: true,
            startsAt: true,
            closedAt: true,
            ticketPrice: true,
          },
        },
      },
    });

    const prizeWins = await this.prisma.prizeResultWinner.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: {
        bet: { select: { id: true, numbers: true } },
        prizeResult: {
          select: {
            prizeType: true,
            totalValue: true,
            bolaoResult: {
              select: {
                closedAt: true,
                bolao: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const payments = await this.prisma.payment.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    });

    const commissions = await this.prisma.walletStatement.findMany({
      where: { wallet: { userId: id }, type: PaymentType.COMMISSION },
      orderBy: { createdAt: "desc" },
    });

    return {
      user: userRecord,
      wallet,
      bets,
      prizeWins,
      payments,
      commissions,
    };
  }

  @Get("tickets")
  async listTickets(
    @CurrentUser() user: UserProfile,
    @Query("search") search?: string,
    @Query("bolao") bolao?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException("Acesso restrito a administradores");
    }

    const and: Prisma.BetWhereInput[] = [];
    const searchTerm = search?.trim();
    if (searchTerm) {
      const digits = searchTerm.replace(/\D/g, "");
      const orUser: Prisma.BetWhereInput[] = [
        { user: { fullName: { contains: searchTerm, mode: "insensitive" } } },
      ];
      if (digits) {
        orUser.push({ user: { cpf: { contains: digits } } });
        orUser.push({ user: { phone: { contains: digits } } });
      }
      and.push({ OR: orUser });
    }

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

    const where: Prisma.BetWhereInput = and.length ? { AND: and } : {};

    return this.prisma.bet.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safePerPage,
      take: safePerPage,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            cpf: true,
            phone: true,
            email: true,
          },
        },
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
