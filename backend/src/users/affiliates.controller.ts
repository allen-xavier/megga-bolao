import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { UserProfile } from "./entities/user.entity";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { PaymentType } from "@prisma/client";

@Controller("affiliates")
@UseGuards(JwtAuthGuard)
export class AffiliatesController {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private baseLink(): string {
    const origins = this.config.get<string[]>("webOrigin") ?? [];
    return origins[0] ?? "";
  }

  @Get("me")
  async me(@CurrentUser() user: UserProfile) {
    const me = await this.prisma.user.findUnique({ where: { id: user.id } });
    const code = me?.referralCode ?? "";
    const direct = await this.prisma.referral.findMany({
      where: { userId: user.id, level: 1 },
      include: { referredUser: { select: { id: true, fullName: true, phone: true, createdAt: true } } },
    });
    const indirect = await this.prisma.referral.findMany({
      where: { userId: user.id, level: 2 },
      include: { referredUser: { select: { id: true, fullName: true, phone: true, createdAt: true } } },
    });

    const earningsAgg = await this.prisma.walletStatement.aggregate({
      _sum: { amount: true },
      where: { wallet: { userId: user.id }, type: PaymentType.COMMISSION },
    });

    return {
      code,
      inviteLink: code && this.baseLink() ? `${this.baseLink()}/register?ref=${code}` : null,
      directCount: direct.length,
      indirectCount: indirect.length,
      earnings: Number(earningsAgg._sum.amount ?? 0),
      direct: direct.map((d) => d.referredUser),
      indirect: indirect.map((d) => d.referredUser),
    };
  }

  @Get("earnings")
  async earnings(@CurrentUser() user: UserProfile) {
    const statements = await this.prisma.walletStatement.findMany({
      where: { wallet: { userId: user.id }, type: PaymentType.COMMISSION },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Mapeia referenceId (bet) -> bolão e apostador
    const betIds = statements.map((s) => s.referenceId).filter((id): id is string => !!id);
    const bets = await this.prisma.bet.findMany({
      where: { id: { in: betIds } },
      select: {
        id: true,
        bolaoId: true,
        bolao: { select: { name: true } },
        user: { select: { fullName: true, phone: true } },
      },
    });
    const betMap = new Map(bets.map((b) => [b.id, b]));

    return statements.map((s) => {
      const b = s.referenceId ? betMap.get(s.referenceId) : null;
      return {
        id: s.id,
        amount: Number(s.amount),
        description: s.description,
        createdAt: s.createdAt,
        bolaoId: b?.bolaoId ?? null,
        bolaoName: b?.bolao.name ?? null,
        sourceUser: b?.user ? { name: b.user.fullName, phone: b.user.phone } : null,
      };
    });
  }

  @Get("tree")
  async tree(@CurrentUser() user: UserProfile) {
    const direct = await this.prisma.referral.findMany({
      where: { userId: user.id, level: 1 },
      include: { referredUser: true },
    });
    const indirect = await this.prisma.referral.findMany({
      where: { userId: user.id, level: 2 },
      include: { referredUser: true },
    });
    return {
      direct,
      indirect,
    };
  }
}
