import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PoliciesService } from "./policies.service";
import { PoliciesController } from "./policies.controller";
import { AdminPoliciesController } from "./policies.admin.controller";

@Module({
  imports: [PrismaModule],
  controllers: [PoliciesController, AdminPoliciesController],
  providers: [PoliciesService],
})
export class PoliciesModule {}
