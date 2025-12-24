import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { SuitpayAdminController } from "./suitpay.controller";
import { AffiliateConfigController } from "./affiliate-config.controller";
import { GeneralConfigController } from "./general-config.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { SuitpayConfigService } from "../payments/suitpay-config.service";

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, SuitpayAdminController, AffiliateConfigController, GeneralConfigController],
  providers: [SuitpayConfigService],
})
export class AdminModule {}
