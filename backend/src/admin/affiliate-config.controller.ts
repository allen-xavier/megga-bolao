import { Body, Controller, Get, Put, UseGuards, ForbiddenException } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../users/decorators/current-user.decorator";
import { UserProfile, UserRole } from "../users/entities/user.entity";
import { PrismaService } from "../prisma/prisma.service";

type AffiliateConfigDto = {
  firstLevelPercent: number;
  secondLevelPercent: number;
  firstBetBonus: number;
  firstBetBonusEnabled: boolean;
};

@Controller("admin/affiliate-config")
@UseGuards(JwtAuthGuard)
export class AffiliateConfigController {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureConfig() {
    return this.prisma.affiliateConfig.upsert({
      where: { id: "global" },
      update: {},
      create: {
        id: "global",
        firstLevelPercent: 2,
        secondLevelPercent: 1,
        firstBetBonus: 0,
        firstBetBonusEnabled: false,
      },
    });
  }

  @Get()
  async getConfig(@CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException("Apenas administradores podem acessar.");
    }
    const config = await this.ensureConfig();
    return {
      firstLevelPercent: Number(config.firstLevelPercent),
      secondLevelPercent: Number(config.secondLevelPercent),
      firstBetBonus: Number(config.firstBetBonus),
      firstBetBonusEnabled: config.firstBetBonusEnabled,
    };
  }

  @Put()
  async updateConfig(@CurrentUser() user: UserProfile, @Body() dto: AffiliateConfigDto) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException("Apenas administradores podem alterar.");
    }
    const clean = {
      firstLevelPercent: Math.max(0, Number(dto.firstLevelPercent ?? 0)),
      secondLevelPercent: Math.max(0, Number(dto.secondLevelPercent ?? 0)),
      firstBetBonus: Math.max(0, Number(dto.firstBetBonus ?? 0)),
      firstBetBonusEnabled: Boolean(dto.firstBetBonusEnabled),
    };
    const updated = await this.prisma.affiliateConfig.update({
      where: { id: "global" },
      data: clean,
    });
    return {
      firstLevelPercent: Number(updated.firstLevelPercent),
      secondLevelPercent: Number(updated.secondLevelPercent),
      firstBetBonus: Number(updated.firstBetBonus),
      firstBetBonusEnabled: updated.firstBetBonusEnabled,
    };
  }
}
