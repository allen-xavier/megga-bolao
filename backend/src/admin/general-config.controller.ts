import { Body, Controller, ForbiddenException, Get, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../users/decorators/current-user.decorator";
import { UserProfile, UserRole } from "../users/entities/user.entity";
import { PrismaService } from "../prisma/prisma.service";

type DefaultPrizeConfig = {
  id: string;
  percentage: number;
  enabled: boolean;
};

type GeneralConfigDto = {
  senaRollPercent: number;
  defaultPrizes?: DefaultPrizeConfig[];
  bolaoMessage?: string;
};

const DEFAULT_PRIZES: DefaultPrizeConfig[] = [
  { id: "pe-quente", percentage: 40, enabled: true },
  { id: "pe-frio", percentage: 12, enabled: true },
  { id: "consolacao", percentage: 8, enabled: true },
  { id: "sena", percentage: 10, enabled: true },
  { id: "ligeirinho", percentage: 5, enabled: true },
  { id: "oito", percentage: 8, enabled: true },
  { id: "indicacao", percentage: 3, enabled: true },
];

const DEFAULT_BOLAO_MESSAGE = "V\u00e1rios Sorteios - at\u00e9 sair um ganhador de 10 Pontos!";

@Controller("admin/general-config")
@UseGuards(JwtAuthGuard)
export class GeneralConfigController {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePrizeConfig(prizes?: DefaultPrizeConfig[]) {
    const map = new Map<string, DefaultPrizeConfig>();
    if (Array.isArray(prizes)) {
      prizes.forEach((item) => {
        if (!item || typeof item.id !== "string") return;
        const percentage = Number(item.percentage);
        map.set(item.id, {
          id: item.id,
          percentage: Number.isFinite(percentage) ? percentage : 0,
          enabled: Boolean(item.enabled),
        });
      });
    }

    return DEFAULT_PRIZES.map((base) => {
      const match = map.get(base.id);
      if (!match) return base;
      return {
        id: base.id,
        percentage: Number.isFinite(match.percentage) ? match.percentage : base.percentage,
        enabled: match.enabled,
      };
    });
  }

  private async ensureConfig() {
    return this.prisma.generalConfig.upsert({
      where: { id: "global" },
      update: {},
      create: {
        id: "global",
        senaRollPercent: 10,
        defaultPrizeConfig: DEFAULT_PRIZES,
        bolaoMessage: DEFAULT_BOLAO_MESSAGE,
      },
    });
  }

  @Get()
  async getConfig(@CurrentUser() user: UserProfile) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException("Apenas administradores podem acessar.");
    }
    const config = await this.ensureConfig();
    const stored = Array.isArray(config.defaultPrizeConfig)
      ? (config.defaultPrizeConfig as DefaultPrizeConfig[])
      : undefined;
    const normalized = this.normalizePrizeConfig(stored);
    return {
      senaRollPercent: Number(config.senaRollPercent),
      defaultPrizes: normalized,
      bolaoMessage: config.bolaoMessage ?? DEFAULT_BOLAO_MESSAGE,
    };
  }

  @Put()
  async updateConfig(@CurrentUser() user: UserProfile, @Body() dto: GeneralConfigDto) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException("Apenas administradores podem alterar.");
    }
    const current = await this.ensureConfig();
    const senaRollPercent = Math.min(100, Math.max(0, Number(dto.senaRollPercent ?? current.senaRollPercent ?? 10)));
    const currentPrizes = Array.isArray(current.defaultPrizeConfig)
      ? (current.defaultPrizeConfig as DefaultPrizeConfig[])
      : undefined;
    const normalizedPrizes = dto.defaultPrizes
      ? this.normalizePrizeConfig(dto.defaultPrizes)
      : this.normalizePrizeConfig(currentPrizes);
    const trimmedMessage = typeof dto.bolaoMessage === "string" ? dto.bolaoMessage.trim() : undefined;
    const bolaoMessage =
      trimmedMessage !== undefined
        ? trimmedMessage || DEFAULT_BOLAO_MESSAGE
        : current.bolaoMessage ?? DEFAULT_BOLAO_MESSAGE;
    const updated = await this.prisma.generalConfig.upsert({
      where: { id: "global" },
      update: { senaRollPercent, defaultPrizeConfig: normalizedPrizes, bolaoMessage },
      create: { id: "global", senaRollPercent, defaultPrizeConfig: normalizedPrizes, bolaoMessage },
    });
    return {
      senaRollPercent: Number(updated.senaRollPercent),
      defaultPrizes: normalizedPrizes,
      bolaoMessage: updated.bolaoMessage ?? bolaoMessage,
    };
  }
}
