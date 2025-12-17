import { Body, Controller, ForbiddenException, Get, Param, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../users/decorators/current-user.decorator";
import { UserProfile, UserRole } from "../users/entities/user.entity";
import { PoliciesService } from "./policies.service";

type UpdatePolicyDto = {
  title: string;
  content: string;
};

@Controller("admin/policies")
@UseGuards(JwtAuthGuard)
export class AdminPoliciesController {
  constructor(private readonly policies: PoliciesService) {}

  private assertAdmin(user: UserProfile) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException("Acesso restrito a administradores");
    }
  }

  @Get(":key")
  async get(@CurrentUser() user: UserProfile, @Param("key") key: string) {
    this.assertAdmin(user);
    const found = await this.policies.findByKey(key);
    return {
      key,
      title: found?.title ?? "Documento",
      content: found?.content ?? "",
      updatedAt: found?.updatedAt ?? null,
    };
  }

  @Put(":key")
  async save(@CurrentUser() user: UserProfile, @Param("key") key: string, @Body() dto: UpdatePolicyDto) {
    this.assertAdmin(user);
    const saved = await this.policies.upsert(key, dto.title?.trim() || "Documento", dto.content ?? "");
    return { key: saved.key, title: saved.title, content: saved.content, updatedAt: saved.updatedAt };
  }
}
