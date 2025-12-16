import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { SuitpayAdminController } from "./suitpay.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { SuitpayConfigService } from "../payments/suitpay-config.service";

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, SuitpayAdminController],
  providers: [SuitpayConfigService],
})
export class AdminModule {}
