import { Body, Controller, ForbiddenException, Get, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../users/decorators/current-user.decorator";
import { UserProfile, UserRole } from "../users/entities/user.entity";
import { SuitpayConfigService } from "../payments/suitpay-config.service";
import { UpdateSuitpayConfigDto } from "../payments/dto/update-suitpay-config.dto";

@Controller("admin/suitpay")
@UseGuards(JwtAuthGuard)
export class SuitpayAdminController {
  constructor(private readonly suitpay: SuitpayConfigService) {}

  private assertAdmin(user: UserProfile) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException("Acesso restrito a administradores");
    }
  }

  @Get("config")
  async getConfig(@CurrentUser() user: UserProfile) {
    this.assertAdmin(user);
    const cfg = await this.suitpay.getConfig();
    return {
      environment: cfg.environment,
      apiUrl: cfg.apiUrl,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      webhookSecret: cfg.webhookSecret,
      autoApprovalLimit: cfg.autoApprovalLimit,
    };
  }

  @Patch("config")
  async updateConfig(@CurrentUser() user: UserProfile, @Body() dto: UpdateSuitpayConfigDto) {
    this.assertAdmin(user);
    const saved = await this.suitpay.saveConfig(dto);
    return {
      environment: saved.environment,
      apiUrl: saved.apiUrl,
      clientId: saved.clientId,
      clientSecret: saved.clientSecret,
      webhookSecret: saved.webhookSecret,
      autoApprovalLimit: saved.autoApprovalLimit,
    };
  }
}
