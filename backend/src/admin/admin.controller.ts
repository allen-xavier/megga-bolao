import { Controller, Get, ForbiddenException, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../users/decorators/current-user.decorator";
import { UserProfile, UserRole } from "../users/entities/user.entity";

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
}
