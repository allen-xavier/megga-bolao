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
