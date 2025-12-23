import { Controller, Get, ForbiddenException, UseGuards, Param, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../users/decorators/current-user.decorator";
import { UserProfile, UserRole } from "../users/entities/user.entity";
import { PaymentType } from "@prisma/client";

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
}
